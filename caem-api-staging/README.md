# Frontend CAEM - Entorno de Staging

## Visión General

La aplicación frontend CAEM es una plataforma Next.js que permite a entidades bancarias:

- Monitoreo en tiempo real de procesos de embargo judicial
- Visualización detallada de casos específicos
- Gestión de API keys
- Diseño responsive para desktop y móvil

## Características Principales

- Autenticación mediante API keys
- Dos vistas principales:
  - Dashboard de screening con todos los casos
  - Vista detallada con información completa de embargos
- Consulta de datos en tiempo real desde el backend
- Opciones de filtrado y paginación

## Tecnologías Utilizadas

- Framework: Next.js 14 (App Router)
- Estilos: CSS Modules
- Gestión de estado: React Context API
- Cliente API: Wrapper personalizado para fetch
- Despliegue: Vercel

------------------------------------------------------------

## Instalación y Ejecución

1. Instalar dependencias:
~ npm install && npm run build

2. Start Command:
~ npm start / npm run dev para entorno local