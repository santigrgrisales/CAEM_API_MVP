📄 README.md – MVP CAEM (Staging)



# CAEM – MVP API (Staging)

Este repositorio expone el MVP de la API CAEM, cuyo objetivo es permitir a entidades bancarias consultar procesos de embargo y desembargo dirigidos a ellas, así como obtener el detalle estructurado de un proceso específico.

La API está diseñada para consumo **batch**, con un endpoint liviano de screening y otro de consulta detallada por identificador de caso (`case_id`).

---

##  Objetivo del MVP

- Permitir que un banco consulte los procesos asociados a su entidad
- Facilitar el cruce de información contra los sistemas internos del banco
- Exponer información estructurada y controlada por entidad bancaria
- Separar consultas masivas (screening) de consultas de detalle

---

##  Autenticación

El acceso a la API se realiza mediante una **API Key**, enviada en el header de cada request:


x-api-key: <api_key_asignada>


Cada API Key está asociada a una entidad bancaria específica.  
Un banco **solo puede acceder a los procesos que le pertenecen**.

---

##  Endpoints disponibles

### 1️⃣ Screening de procesos

Permite obtener un listado de procesos asociados a la entidad bancaria autenticada.

**GET** `/api/screening`

#### Headers

x-api-key: <api_key>


#### Query Params (opcionales)

| Parámetro | Descripción |
|---------|------------|
| limit | Número máximo de registros a retornar (default 100) |
| offset | Paginación |
| fecha_desde | Filtro por fecha de recepción (ISO) |
| fecha_hasta | Filtro por fecha de recepción (ISO) |

#### Respuesta

```json
[
  {
    "case_id": "uuid",
    "tipo_id_demandado": "CEDULA | NIT",
    "id_demandado": "string",
    "tipo_orden": "EMBARGO | DESEMBARGO",
    "fecha_recepcion": "YYYY-MM-DD",
    "entidad_remitente": "string"
  }
]

Este endpoint está pensado para que el banco realice cruces masivos contra su core bancario.

2️⃣ Detalle de proceso

Retorna el detalle completo de un proceso específico.

GET /api/case/:case_id

Headers
x-api-key: <api_key>
Path Params
Parámetro	Descripción
case_id	Identificador único del proceso
Respuesta
{
  "case_id": "uuid",
  "embargo_id": "string",
  "tipo_id_demandado": "CEDULA | NIT",
  "id_demandado": "string",
  "nombre_demandado": "string",
  "tipo_orden": "EMBARGO | DESEMBARGO",
  "tipo_embargo": "JUDICIAL",
  "fecha_recepcion": "YYYY-MM-DD",
  "fecha_oficio": "YYYY-MM-DD",
  "entidad_remitente": "string",
  "estado_embargo": "PROCESADO",
  "ciudad": "string",
  "monto_a_embargar": 66238327,
  "monto_embargado": 0,
  "banco_nombre": "BANCO_X"
}

#El banco solo puede consultar procesos asociados a su entidad bancaria.

#Modelo de datos (resumen)

Fuente principal: información judicial de procesos

Vista de trabajo: procesos_banco

Identificador externo: case_id (UUID)

Asociación por entidad bancaria mediante entidad_bancaria_id

El diseño permite que una persona tenga múltiples procesos y que cada proceso sea consultado de manera independiente.


## Consideraciones de diseño

- El sistema implementa deduplicación lógica de oficios judiciales mediante un `fingerprint` determinístico.
- Se garantiza unicidad únicamente para procesos activos, preservando duplicados históricos con fines de trazabilidad.


### Ejemplos de uso
Screening
curl -H "x-api-key: test_key_bancox_2" \
http://localhost:3000/api/screening?limit=50
Detalle
curl -H "x-api-key: test_key_bancox_2" \
http://localhost:3000/api/case/<case_id>




🚧 Próximos pasos (Tareas en proceso)

Versionado de API

Documentación OpenAPI / Swagger

Colección Postman exportable