# FleetNova — Web

Frontend web de FleetNova, plataforma de gestión de flotas para monitoreo de camiones de carga pesada vía GPS y telemetría OBD-II.

## Stack

- React 18 + Vite + TypeScript
- Tailwind CSS (v4, plugin de Vite)
- React Router v6 para el enrutamiento
- TanStack Query para el estado del servidor / fetching de datos
- Axios como cliente HTTP (con interceptores de autenticación)
- react-leaflet + Leaflet para el mapa (tiles de OpenStreetMap, sin necesidad de API key)
- react-hook-form para los formularios

## Requisitos previos

- Node.js 18 o superior (probado con Node 24) y npm
- El backend de FleetNova corriendo (Express + Prisma + PostgreSQL), expuesto por defecto en `http://localhost:4000/api`

Este frontend **no funciona de forma aislada**: espera que el backend esté disponible en la URL configurada en `VITE_API_URL`. Si el backend no está corriendo, la aplicación sigue funcionando (no se cae), pero las pantallas mostrarán mensajes de error de red en lugar de datos.

## Configuración del entorno

1. Copia el archivo de ejemplo y ajusta la URL si es necesario:

   ```bash
   cp .env.example .env
   ```

   Variable disponible:

   ```
   VITE_API_URL=http://localhost:4000/api
   ```

2. Instala las dependencias:

   ```bash
   npm install
   ```

## Ejecutar en modo desarrollo

```bash
npm run dev
```

Esto inicia el servidor de desarrollo de Vite (por defecto en `http://localhost:5173`).

## Compilar para producción

```bash
npm run build
```

Ejecuta la verificación de tipos de TypeScript (`tsc -b`) y genera el build de producción con Vite en `dist/`.

Para previsualizar el build de producción localmente:

```bash
npm run preview
```

## Estructura del proyecto

- `src/lib/api.ts` — instancia de Axios con interceptores (adjunta el token JWT, redirige a `/login` en 401).
- `src/lib/auth.tsx` — contexto de autenticación (`AuthProvider`, `useAuth`), persistido en `localStorage`.
- `src/components/` — componentes compartidos (layout, badges, modales, estados de carga/error, mapa, secciones del detalle de vehículo).
- `src/pages/` — páginas de la aplicación: Login, Dashboard, Vehículos, Detalle de vehículo, Conductores, Alertas, Usuarios.
- `src/types/` — tipos TypeScript que reflejan el contrato de la API del backend.

## Notas

- Todos los textos de la interfaz están en español.
- Los permisos de escritura (crear/editar/eliminar) se muestran solo para roles `ADMIN` y `OPERATOR`; el rol `VIEWER` tiene acceso de solo lectura. La sección de Usuarios es exclusiva para `ADMIN`.
- Todas las peticiones GET usan TanStack Query, con invalidación de caché tras cada mutación exitosa.
