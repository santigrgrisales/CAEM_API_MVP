
---

# Documentación de la API - Gestión Judicial (MVP CAEM)

## 📌 Versión Actual: v1.1

### 🔄 Cambios respecto a la versión anterior:
*   **Eliminado:** Campo `proceso.monto` (reemplazado por lógica de negocio específica).
*   **Agregado:** Campo `remitente.ciudad` en el objeto de respuesta.
*   **Mejora:** Diccionario de datos ampliado con descripción estructurada por categorías.

---

## 🏛️ Arquitectura de Datos y Modelo de Negocio

Para garantizar tiempos de respuesta óptimos (**baja latencia**) y **alta escalabilidad** al ser consumida por múltiples entidades bancarias, se diseñó un modelo de datos basado en procesos de extracción, transformación y carga (**ETL**).

### 1. Entendimiento del Negocio
El flujo de información judicial procesada sigue esta lógica:
1.  **Remitente:** (Juzgado o ente coactivo) emite una orden legal.
2.  **Proceso / Embargo:** Dicta una medida cautelar (embargo/desembargo).
3.  **Demandado:** Titular de la cuenta sobre quien recae la medida.
4.  **Demandante:** Persona/Entidad a quien se le debe el dinero.
5.  **Notificación:** El sistema notifica a la **Entidad Bancaria** para su aplicación.

### 2. Origen y Transformación
Se extrajo una muestra de **50.000 registros** por tabla desde la base transaccional original:
*   `embargos` (Maestra)
*   `demandado` (Hija)
*   `demandante` (Hija)
*   `banks` (Entidades autorizadas)

Para optimizar el rendimiento, se implementó una **tabla desnormalizada** llamada `procesos_banco`. Esto evita realizar JOINs complejos en cada petición, permitiendo consultas planas ultra-rápidas.

---

## 🛡️ Reglas de Negocio y Control de Calidad

### 1. Prevención de Duplicados (Fingerprint)
Se implementó un campo `fingerprint` (Hash SHA-256) único para evitar registros redundantes. Se calcula combinando:
`embargo_id + entidad_bancaria_id + identificacion_demandado + monto_a_embargar`.

### 2. Filtro de Registros Inactivos
Los registros en estado `SIN_CONFIRMAR` o marcados como eliminados (`deleted = TRUE`) son excluidos automáticamente del pipeline.

### 3. Inteligencia de Datos
Se utiliza `COALESCE(e.oficio, e.radicado_banco)` para garantizar que siempre exista un identificador de trazabilidad para el banco.

---

## 🚀 Especificaciones Técnicas

**Base URL:** `https://caem-api-mvp.onrender.com`

### Autenticación
Todas las peticiones deben incluir el siguiente Header:
`x-api-key: <tu_api_key>`

### Ejemplo de Header (usar para pruebas)

`x-api-key: test_key_bancoy_4`

> **Nota:** El incumplimiento genera errores `401 Unauthorized`.

---

## 🛣️ Endpoints

### 1️⃣ Screening (Búsqueda General)
`GET /api/screening`

| Parámetro | Tipo | Descripción |
| :--- | :--- | :--- |
| `limit` | Int | Cantidad de registros a devolver. |
| `offset` | Int | Desplazamiento para paginación. |
| `fecha_desde` | Date | Filtro de fecha inicial. |
| `fecha_hasta` | Date | Filtro de fecha final. |

**Ejemplo de respuesta:**
```json
[
  {
    "case_id": "uuid-v4-identificador",
    "tipo_id_demandado": "CEDULA",
    "id_demandado": "1032440232",
    "tipo_orden": "EMBARGO",
    "fecha_recepcion": "2023-05-19T05:00:00.000Z",
    "demandante": "SERVICIOS SAS"
  }
]
```


### 23 Consulta Detallada (Batch)
`POST /api/cases/batch?fields=<campos>`

Permite obtener el detalle completo de hasta **500 IDs** por petición. Ahora soporta filtrado dinámico de campos mediante el parámetro `fields` en el query string.

**Cuerpo de la petición (Body):**
```json
{
  "case_ids": ["uuid1", "uuid2"]
}
```

**Parámetro de filtrado de campos (opcional):**
`fields=proceso.id,proceso.numero_oficio,demandado.nombre,demandante.nombre,remitente.nombre,remitente.ciudad`

**Ejemplo de petición:**
```
POST /api/cases/batch?fields=proceso.id,demandado.nombre,remitente.ciudad
{
  "case_ids": ["uuid1", "uuid2"]
}
```

**Respuesta Detallada (v1.1):**
```json
{
  "results": [
    {
      "case_id": "uuid",
      "proceso": {
        "id": "23050300006",
        "numero_oficio": "NR0118"
      },
      "demandado": {
        "nombre": "JUAN PEREZ"
      },
      "remitente": {
        "ciudad": "CARTAGENA"
      }
    }
  ],
  "not_found": []
}
```

---

## 📖 Diccionario de Datos

### 🔹 Nivel General
| Campo | Tipo | Descripción |
| :--- | :--- | :--- |
| `case_id` | UUID | Identificador único interno del caso en CAEM. |
| `not_found` | Array | Lista de IDs no encontrados o no asociados al banco. |

### 🔹 Categoría: Proceso
| Campo | Tipo | Descripción |
| :--- | :--- | :--- |
| `id` | String | ID original del embargo en el sistema judicial. |
| `numero_oficio` | String | Número oficial del documento emitido. |
| `fecha_oficio` | DateTime | Fecha de emisión del documento. |
| `monto_a_embargar`| Numeric | Valor que el banco debe retener. |

### 🔹 Categoría: Demandado/Demandante
| Campo | Tipo | Descripción |
| :--- | :--- | :--- |
| `nombre` | String | Nombre completo o razón social. |
| `documento` | String | Número de identificación. |
| `tipo_documento` | String | CEDULA, NIT, PASAPORTE, etc. |

### 🔹 Categoría: Remitente
| Campo | Tipo | Descripción |
| :--- | :--- | :--- |
| `nombre` | String | Entidad judicial emisora. |
| `ciudad` | String | Ciudad de origen del oficio. |
| `correo_electronico`| String | Contacto oficial del juzgado. |

---

## ⚠️ Gestión de Errores

| Código | Descripción |
| :--- | :--- |
| **400** | Petición mal formada (ej. más de 500 IDs o JSON inválido). |
| **401** | API Key inválida o banco no identificado. |
| **500** | Error interno de servidor o base de datos. |

---

## 🛠️ Estado del MVP
- ✅ Modelo desnormalizado operativo.
- ✅ Prevención de duplicados por Fingerprint.
- ✅ Endpoint Batch (Límite 500).
- ✅ Exportación CSV habilitada en Frontend.
- ✅ Documentación v1.1 Completa.

---


