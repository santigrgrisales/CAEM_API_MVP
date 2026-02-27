# MVP CAEM - Documentación del Backend

## Visión General

El backend de la API CAEM provee endpoints para que entidades bancarias consulten procesos de embargo y desembargo dirigidos a ellas, junto con información detallada de casos específicos.

## Características Principales

- Capacidad de procesamiento por lotes (batch)
- Endpoint liviano para screening
- Consulta detallada por `case_id`
- Control de acceso basado en entidades mediante API keys
- Deduplicación de procesos judiciales
- Trazabilidad histórica de duplicados

## Arquitectura del Sistema

### Componentes Clave

1. **Middleware de Autenticación** - Valida API keys y controla acceso por entidad
2. **Rutas**
   - `/api/screening` - Screening de procesos
   - `/api/case/:case_id` - Consulta detallada de casos
3. **Servicios** - Lógica de negocio para procesar solicitudes
4. **Base de Datos** - PostgreSQL con datos de procesos judiciales

## Autenticación

Todas las solicitudes requieren el header `x-api-key` con una API key válida asignada a la entidad bancaria. Cada key solo da acceso a procesos de esa entidad.

--------------------------------------------------------------------------------

## Instalación y Ejecución

1. Instalar dependencias:
~ npm install

2. Start Command:
~ node src/index.js
