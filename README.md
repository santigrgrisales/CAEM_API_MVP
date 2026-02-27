# Documentación API 

## Arquitectura de Datos y Modelo de Negocio

Para garantizar que la API ofrezca tiempos de respuesta óptimos (baja latencia) y sea altamente escalable al ser consumida por múltiples entidades bancarias, se diseñó un modelo de datos optimizado basado en procesos de extracción, transformación y carga (ETL).

### 1. Entendimiento del Negocio
El flujo de la información judicial procesada en esta API obedece a la siguiente lógica del mundo real:
- Un **Remitente** (Ej. Juzgado o ente coactivo) emite una orden legal.
- Esta orden es el **Proceso / Embargo**, el cual dicta una medida cautelar (embargo o desembargo).
- La medida recae sobre los fondos de un **Demandado** (titular de la cuenta).
- La acción es motivada por una deuda hacia un **Demandante**.
- El sistema notifica a la **Entidad Bancaria** correspondiente para que aplique la medida.

### 2. Origen de los Datos
Se extrajo una muestra representativa de aproximadamente **50.000 registros** por tabla desde la base de datos transaccional original. Las tablas relacionales de origen son:
- `embargos` (Tabla Maestra): Contiene la información del documento legal y los datos del juzgado (Remitente).
- `demandado` (Tabla Hija): Contiene a quién se le aplica la medida y los montos a retener.
- `demandante` (Tabla Hija): Contiene quién interpuso la demanda.
- `banks` (Tabla de Entidades): Creada específicamente para este MVP para gestionar la validación y autenticación (vía `api_key`) de cada banco.

### 3. Modelo Desnormalizado: Tabla `procesos_banco`
Para evitar que la API realice cruces complejos (`JOINs` entre 4 tablas) en cada petición de los bancos, se implementó una **tabla desnormalizada (plana)** llamada `procesos_banco`. 

La consolidación se realizó mediante un script SQL (`INSERT INTO ... SELECT ...`) cruzando la tabla de embargos estrictamente con el demandado (`JOIN`), y de manera flexible con el demandante (`LEFT JOIN`), dado que en ocasiones el sistema judicial omite temporalmente esta figura.

#### Reglas de Negocio, Limpieza y Control de Calidad
Durante la migración hacia `procesos_banco` se aplicaron las siguientes validaciones estructurales:

1. **Prevención Estricta de Duplicados (Fingerprint):** 
   Se implementó un campo `fingerprint` que calcula un hash criptográfico **SHA-256** combinando variables clave: `embargo_id`, `entidad_bancaria_id`, `identificacion` del demandado y el `monto_a_embargar`. La restricción `ON CONFLICT (fingerprint) DO NOTHING` garantiza que la base de datos jamás inserte ni envíe al banco un embargo duplicado.

2. **Filtro de Registros Inactivos (SIN_CONFIRMAR):**
   > **Nota:** Los registros en estado `SIN_CONFIRMAR` no aparecen en la tabla `procesos_banco`. Esto se debe a que, en la base de datos origen, estos registros se encuentran marcados con la bandera `deleted = TRUE`. Se tomó la decisión arquitectónica de excluirlos de la carga (`WHERE e.deleted = FALSE`) ya que representan una desactivación lógica y no forman parte del universo vigente de procesos accionables para el banco.

3. **Inteligencia de Datos (Manejo de Nulos):**
   Se utilizó la función `COALESCE(e.oficio, e.radicado_banco)` para asegurar que, si el número de oficio original de la entidad judicial venía vacío, el sistema automáticamente asigne el radicado interno del banco, garantizando la trazabilidad del proceso.

---

### 4. Mapeo de Datos (Data Mapping API 2)
La respuesta estructurada del endpoint detallado (`POST /api/cases/batch`) reconstruye la información tomando los datos consolidados de `procesos_banco`, los cuales provienen originalmente de:

| Objeto API | Campo en JSON | Tabla Origen | Campo Origen |
| :--- | :--- | :--- | :--- |
| **`proceso`** | `id` | `embargos` | `id` |
| | `numero_oficio` | `embargos` | `oficio` (o `radicado_banco`) |
| | `fecha_oficio` | `embargos` | `fecha_oficio` |
| | `fecha_recepcion` | `embargos` | `fecha_recibido` |
| | `titulo_embargo` | `embargos` | `tipo_embargo` |
| | `titulo_orden` | `embargos` | `tipo_documento` |
| | `monto` | `demandado` | `monto_embargado` |
| | `monto_a_embargar` | `demandado` | `montoaembargar` |
| **`demandado`** | `nombre` | `demandado` | `nombres` |
| | `documento` | `demandado` | `identificacion` |
| | `tipo_documento` | `demandado` | `tipo_identificacion_tipo` |
| **`demandante`**| `nombre` | `demandante` | `nombres` |
| | `documento` | `demandante` | `identificacion` |
| | `tipo_documento` | `demandante` | `tipo_identificacion_tipo` |
| **`remitente`** | `nombre` | `embargos` | `entidad_remitente` |
| | `direccion` | `embargos` | `direccion` |
| | `correo_electronico` | `embargos` | `correo` |
| | `nombre_personal` | `embargos` | `funcionario` |





# MVP CAEM (Staging)

## Visión General
La API MVP permite a las entidades bancarias consultar y gestionar de forma automatizada y segura los oficios judiciales (embargos, desembargos) dirigidos a ellos. 

El flujo principal consta de dos pasos:
1. **Screening:** El banco consulta el listado general de oficios activos o novedades.
2. **Detalle (Batch):** Con base en los IDs obtenidos en el screening, el banco solicita el detalle estructurado de los casos de su interés.

---

## Entorno y Autenticación

- **Base URL (Staging):** `https://caem-api-mvp.onrender.com`
- **Autenticación:** Vía Header mediante API Key.

Todas las peticiones deben incluir el header `x-api-key` con el token provisto para su entidad bancaria.

**Ejemplo de Header:**
\`\`\`http
x-api-key: test_key_bancoy_4
\`\`\`

**Códigos de Error de Autenticación:**
- `401 Unauthorized`: Si el API Key no se envía o es inválido (`{ "error": "Invalid API key" }` / `{ "error": "Bank not identified" }`).

---

## Endpoints

### 1. Screening de Oficios
Obtiene una lista resumida de los procesos judiciales activos dirigidos a la entidad bancaria autenticada.

- **Método:** `GET`
- **Ruta:** `/api/screening`
- **Query Parameters (Opcionales):**
  - `limit` (int): Cantidad máxima de registros a retornar (Default: 5000, Max: 50000).
  - `offset` (int): Paginación, registros a saltar (Default: 0).
  - `fecha_desde` (YYYY-MM-DD): Filtra oficios recibidos a partir de esta fecha.
  - `fecha_hasta` (YYYY-MM-DD): Filtra oficios recibidos hasta esta fecha.

**Ejemplo de Petición:**
\`\`\`http
GET /api/screening?limit=100&fecha_desde=2023-01-01 HTTP/1.1
Host: caem-api-mvp-1.onrender.com
x-api-key: test_key_bancoy_4
\`\`\`

**Ejemplo de Respuesta (200 OK):**
\`\`\`json[
  {
    "case_id": "4f67b712-96a7-4611-9bc2-e8b6f1c69fd5",
    "tipo_id_demandado": "CEDULA",
    "id_demandado": "1032440232",
    "tipo_orden": "EMBARGO",
    "fecha_recepcion": "2023-05-19T05:00:00.000Z",
    "demandante": "SERVICIOS DE INGENIERA DE DATOS SAS"
  }
]
\`\`\`

---

### 2. Consulta Detallada por Lotes (Batch)
Retorna la información estructurada y detallada de casos específicos mediante sus identificadores únicos (`case_id`).

- **Método:** `POST`
- **Ruta:** `/api/cases/batch`
- **Content-Type:** `application/json`

**Reglas de negocio:**
- Se requiere enviar un array llamado `case_ids`.
- El array no puede estar vacío y tiene un límite máximo de **500** IDs por petición.

**Cuerpo de la Petición (Body):**
\`\`\`json
{
  "case_ids":[
    "b31ff2d9-4998-46ae-bfea-c700e52ab05f",
    "8e1678b7-2eae-418f-bf7d-f7980d8ceddf"
  ]
}
\`\`\`

**Ejemplo de Respuesta (200 OK):**
\`\`\`json
{
  "results":[
    {
      "case_id": "b31ff2d9-4998-46ae-bfea-c700e52ab05f",
      "proceso": {
        "id": "23050300006",
        "numero_oficio": "NR0118",
        "fecha_oficio": "2023-04-27T05:00:00.000Z",
        "fecha_recepcion": "2023-05-02T05:00:00.000Z",
        "titulo_embargo": "JUDICIAL",
        "titulo_orden": "EMBARGO",
        "monto": 0,
        "monto_a_embargar": 32604867
      },
      "demandado": {
        "nombre": "SOL MERY BALLESTEROS MAHECHA",
        "documento": "22789966",
        "tipo_documento": "CEDULA"
      },
      "demandante": {
        "nombre": "BANCO CAJA SOCIAL SA",
        "documento": "8600073354",
        "tipo_documento": "NIT"
      },
      "remitente": {
        "nombre": "JUZGADO CUARTO DE PEQUEÑAS CAUSAS...",
        "direccion": "Av. Consulado Carrera 65...",
        "correo_electronico": "j04peqcacmcgena@cendoj.ramajudicial.gov.co",
        "nombre_personal": "HAROLD NICOLAS RODRIGUEZ SOLANO"
      }
    }
  ],
  "not_found":[]
}
\`\`\`

**Códigos de Error:**
- `400 Bad Request`: `{ "error": "case_ids must be a non-empty array" }` o `{ "error": "Too many case_ids. Max 500" }`
- `500 Internal Server Error`: `{ "error": "Database error" }`

---

## Diccionario de Datos

A continuación, se describen los campos más relevantes retornados en las consultas:

| Objeto / Campo | Tipo | Descripción |
| :--- | :--- | :--- |
| `case_id` | UUID | Identificador único interno del caso en el sistema CAEM. |
| `proceso.id` | String | ID original del embargo. |
| `proceso.numero_oficio` | String | Número del oficio radicado o notificado. |
| `proceso.fecha_recepcion` | DateTime | Fecha en que el sistema recepcionó el proceso judicial. |
| `proceso.titulo_orden` | String | Tipo de acción requerida (ej. `EMBARGO`, `DESEMBARGO`). |
| `proceso.monto_a_embargar`| Numeric | Cantidad solicitada a retener/embargar al demandado. |
| `demandado.documento` | String | Número de identificación del cliente/demandado. |
| `demandado.tipo_documento`| String | Tipo de identificación (ej. `CEDULA`, `NIT`). |
| `remitente.nombre` | String | Entidad judicial de origen (Juzgado, Secretaría, etc.). |
| `not_found` | Array | Lista de `case_id` que no fueron encontrados o no pertenecen al banco. |