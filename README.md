# Documentación API - MVP CAEM (Staging)

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