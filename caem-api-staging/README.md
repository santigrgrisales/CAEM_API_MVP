# Frontend CAEM - Entorno de Staging

## Visión General

La aplicación frontend CAEM es una plataforma Next.js que permite a entidades bancarias:

- Monitoreo en tiempo real de procesos de embargo judicial
- Visualización detallada de casos específicos
- Gestión de API keys
- Diseño responsive para desktop y móvil
- Exportación de datos a formato CSV

## Características Principales

- Autenticación mediante API keys
- Dos vistas principales:
  - Dashboard de screening con todos los casos
  - Vista detallada con información completa de embargos
- Consulta de datos en tiempo real desde el backend
- Opciones de filtrado y búsqueda
- Exportación de datos a CSV

### Exportación CSV

La aplicación incluye funcionalidad completa de exportación a formato CSV:

#### Vista de Screening (Tabla Principal)

En la tabla de oficios recibidos, se encuentra un botón verde "Exportar CSV" que ofrece un dropdown con dos opciones:

1. **Exportar todos**: Descarga todos los registros visibles (o filtrados si hay búsqueda activa)
   - Archivo: `screening_export_YYYY-MM-DD.csv`
   - Incluye todas las columnas de la tabla

2. **Exportar seleccionados**: Descarga únicamente los registros marcados con checkbox
   - Archivo: `screening_selected_N_YYYY-MM-DD.csv` (N = cantidad de registros)

#### Vista de Detalles de Casos

En el visor de detalles de expedientes:

1. **Exportar todo a CSV**: Botón en el header que descarga todos los casos consultados
   - Archivo: `cases_details_export_N_YYYY-MM-DD.csv`

2. **Exportar por expediente**: Botón individual "CSV" en cada tarjeta de expediente
   - Archivo: `case_{id}_details.csv`

Los datos de detalles se exportan aplanados con prefijos de categoría:
- `PROCESO_*` - Identificación del proceso
- `DEMANDADO_*` - Información del demandado
- `DEMANDANTE_*` - Información del demandante
- `REMITENTE_*` - Información del remitente

#### Características Técnicas del CSV

- Encoding UTF-8 con BOM para compatibilidad con Excel
- Escape correcto de caracteres especiales (comas, comillas, saltos de línea)
- Headers dinámicos basados en las claves de los datos
- Formato tabular legible

## Tecnologías Utilizadas

- Framework: Next.js 14 (App Router)
- Estilos: CSS Modules + Tailwind CSS
- Gestión de estado: React Hooks (useState, useEffect)
- Cliente API: Wrapper personalizado para fetch
- Utilidades: Módulo CSV personalizado (`lib/csv.js`)
- Despliegue: Vercel

------------------------------------------------------------

## Estructura de Archivos

```
caem-api-staging/
├── app/
│   ├── page.js                 # Página principal (login con API Key)
│   ├── screening/page.js       # Dashboard principal
│   ├── cases/page.js           # Vista de casos (no implementada)
│   └── globals.css             # Estilos globales
├── components/
│   ├── ApiKeyForm.js           # Formulario de autenticación
│   ├── ScreeningTable.js       # Tabla de screening con exportación CSV
│   └── CaseDetailViewer.js    # Visor de detalles con exportación CSV
├── lib/
│   ├── api.js                 # Cliente API
│   └── csv.js                 # Utilidades de exportación CSV
└── styles/
    └── globals.css            # Estilos principales
```

------------------------------------------------------------

## Instalación y Ejecución

1. Instalar dependencias:
```bash
npm install && npm run build
```

2. Start Command:
```
bash
npm start    # Producción
npm run dev  # Desarrollo local
```

------------------------------------------------------------

## Flujo de Uso

1. **Autenticación**: Ingresar API Key del banco
2. **Screening**: Ver lista de procesos/embargos disponibles
3. **Búsqueda**: Filtrar por Case ID, ID Demandado o Entidad
4. **Selección**: Seleccionar registros deseados
5. **Ver Detalles**: Consultar información completa de seleccionados
6. **Exportar**: Descargar datos a CSV según necesidad

## API Keys

Cada banco tiene una API Key única que permite:
- Consultar sus propios procesos de embargo
- Acceder a información detallada de expedientes
- La clave se almacena en localStorage durante la sesión

## Notas de Desarrollo

- La búsqueda en la tabla de screening es local (frontend)
- Los datos de detalles se consultan al backend al presionar "Ver Detalles"
- Límite de consulta: 500 registros por solicitud (configurable en backend)
- La exportación CSV maneja datos anidados y los aplana para legibilidad
