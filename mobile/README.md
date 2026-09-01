# FleetNova — App móvil (Conductor)

App web instalable (PWA) exclusiva para el actor **Conductor**. No es una app nativa (se descartó Flutter): es una PWA construida con React + Vite + TypeScript, instalable en Android vía `manifest.json` + service worker, para no duplicar stack ni curva de aprendizaje respecto al proyecto web.

## Stack

- React 19 + Vite + TypeScript
- Tailwind CSS v4
- React Router v7 (con una barra de navegación inferior estilo app)
- TanStack Query para el estado del servidor
- Axios como cliente HTTP
- react-leaflet + Leaflet para el mapa
- `public/manifest.json` + `public/sw.js` para que sea instalable (PWA)

## Requisitos previos

- Node.js 18+ y npm
- El backend de FleetNova corriendo en `http://localhost:4000`
- Al menos un usuario con rol `DRIVER` (los crea el `seed` del backend)

## Configuración

```bash
cp .env.example .env
npm install
```

Variable disponible en `.env`:

```
VITE_API_URL=http://localhost:4000/api
```

## Ejecutar en desarrollo

```bash
npm run dev
```

Sirve en `http://localhost:5173` — pero para no chocar con la web (que usa ese puerto), aquí `vite.config.ts` fija el puerto **5174**.

Credenciales de prueba (creadas por el seed del backend, ver `backend/prisma/seed.ts`): cualquiera de los conductores, ej. `carlos.andres.ramirez@fleetnova.com` / `conductor123`.

## Por qué esta cuenta y no otra

Esta app **rechaza el login si el rol no es `DRIVER`** (ver `src/lib/auth.tsx`) — es el espejo de lo que hace la plataforma web, que rechaza a `DRIVER`. Cada app es exclusiva de su actor.

## Alcance (lo que hace hoy)

- Iniciar sesión / cerrar sesión.
- Inicio: vehículo asignado, estado mecánico (OBD-II) y ubicación resumida.
- Mapa: ubicación del vehículo asignado en tiempo real (Leaflet).
- Mantenimiento: mantenimientos programados del vehículo.
- Alertas: alertas del vehículo asignado.
- Recorridos: historial de viajes.
- Perfil: datos del conductor y cierre de sesión.

Todo consume `/api/driver/*` en el backend, que ya limita cada respuesta al vehículo asignado del conductor autenticado — la app no filtra nada por su cuenta, confía en que el backend nunca le devuelve datos de otro vehículo.

## Instalar como app (PWA)

Con `npm run build && npm run preview` (o ya desplegada), Chrome en Android ofrece "Agregar a pantalla de inicio" gracias a `manifest.json` + `sw.js`. En `localhost` durante desarrollo también es instalable (Chrome trata `localhost` como origen seguro).

## Pendiente / fuera de alcance de esta primera versión

- Notificaciones push reales (RF11) — hoy las alertas se consultan, no se empujan.
- Reportar fallas o incidencias desde la app (no está en el alcance original del backlog).
