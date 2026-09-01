# FleetNova - Backend

Backend del proyecto de capstone FleetNova: plataforma de gestion de flota
para monitoreo de camiones de carga pesada via GPS + OBD-II (telemetria
simulada, sin hardware real).

## Stack

- Node.js 24 + TypeScript
- Express
- Prisma ORM + PostgreSQL
- JWT (jsonwebtoken) + bcryptjs para autenticacion
- Zod para validacion de requests
- ts-node-dev para desarrollo con recarga en caliente

## Prerequisitos

- Node.js v24+
- PostgreSQL 18 instalado y corriendo localmente (servicio `postgresql-x64-18`
  en Windows), accesible via `psql`.

## Configuracion de entorno

1. Copia `.env.example` a `.env`.
2. Edita `DATABASE_URL` con las credenciales reales de tu instalacion local
   de PostgreSQL. En esta maquina de desarrollo, el usuario `postgres`
   requiere autenticacion por contrasena (`scram-sha-256`, no hay
   trust/peer auth en Windows). La contrasena real **no** esta en este
   README por seguridad; pidela a quien administra la base de datos local
   o revisa tu propio `.env` (esta en `.gitignore`, nunca se sube al repo).
   El formato de la cadena de conexion que funciono en esta maquina es:

   ```
   DATABASE_URL="postgresql://postgres:<TU_PASSWORD>@localhost:5432/fleetnova?schema=public"
   ```

3. Si la base de datos `fleetnova` no existe todavia, creala:

   ```
   psql -U postgres -h localhost -c "CREATE DATABASE fleetnova;"
   ```

## Instalacion

```
npm install
```

## Migraciones (Prisma)

```
npm run prisma:generate
npm run prisma:migrate -- --name init
```

(La primera vez usa `npx prisma migrate dev --name init` directamente si
prefieres ver el nombre de la migracion explicito.)

## Seed (datos de ejemplo)

```
npm run seed
```

Crea (o actualiza de forma idempotente, via `upsert`):

- 1 usuario administrador: `admin@fleetnova.com` / `admin1234`
- 5 vehiculos de carga pesada (Kenworth, International, Freightliner, Volvo,
  Mack) con distintos estados y kilometrajes
- 5 conductores colombianos, cada uno asignado a un vehiculo
- Programaciones y registros de mantenimiento de ejemplo por vehiculo

## Correr el servidor de desarrollo

```
npm run dev
```

El servidor queda escuchando en `http://localhost:4000` (o el puerto que
definas en `PORT`). Verifica con:

```
curl http://localhost:4000/api/health
```

## Build de produccion

```
npm run build
npm start
```

## Simulador de telemetria GPS + OBD-II

Con el servidor de desarrollo corriendo en otra terminal, ejecuta:

```
npm run simulate
```

Este script (`src/scripts/simulate.ts`) lee los vehiculos con
`status = ACTIVE` desde la base de datos y hace que cada uno recorra una
ruta real de Bucaramanga (obtenida de OSRM, codificada como polyline),
respetando calles reales en vez de caminar al azar; al llegar al final de
su ruta, el vehiculo invierte el sentido y regresa por la misma via. Cada
2 segundos envia telemetria a `/api/telemetry/gps` (siempre) y
`/api/telemetry/obd` (aproximadamente cada 3er tick), autenticandose con
el header `x-device-key` (valor de `DEVICE_API_KEY` en `.env`).
Ocasionalmente simula temperaturas de motor elevadas, voltaje de bateria
bajo y codigos de falla
para disparar alertas automaticas. Corre indefinidamente hasta Ctrl+C.

## Endpoints de la API

Todas las listas se devuelven como arreglos JSON planos. Los errores
devuelven `{ "error": "mensaje" }` con el codigo HTTP correspondiente
(400 validacion, 401 sin autenticar, 403 sin permisos, 404 no encontrado,
500 error inesperado).

### Salud

- `GET /api/health` - sin autenticacion

### Autenticacion

- `POST /api/auth/login` - sin autenticacion
- `GET /api/auth/me` - requiere JWT

### Usuarios (RF18 - gestion de usuarios)

- `GET /api/users` - requiere JWT, rol ADMIN
- `POST /api/users` - requiere JWT, rol ADMIN
- `PATCH /api/users/:id` - requiere JWT, rol ADMIN
- `DELETE /api/users/:id` - requiere JWT, rol ADMIN

### Vehiculos

- `GET /api/vehicles` (filtros `?plate=` y `?status=`, RF13) - requiere JWT
- `GET /api/vehicles/:id` - requiere JWT
- `POST /api/vehicles` - requiere JWT, rol ADMIN u OPERATOR
- `PATCH /api/vehicles/:id` - requiere JWT, rol ADMIN u OPERATOR
- `DELETE /api/vehicles/:id` - requiere JWT, rol ADMIN u OPERATOR
- `GET /api/vehicles/:id/status` (vista unificada GPS+OBD, RF15) - requiere JWT
- `GET /api/vehicles/:id/tire-wear` - requiere JWT
- `GET /api/vehicles/:id/gps-history` (`?from=&to=&limit=`) - requiere JWT
- `GET /api/vehicles/:id/trips` - requiere JWT
- `POST /api/vehicles/:id/assign-driver` - requiere JWT, rol ADMIN u OPERATOR

### Conductores

- `GET /api/drivers` - requiere JWT
- `POST /api/drivers` - requiere JWT, rol ADMIN u OPERATOR
- `PATCH /api/drivers/:id` - requiere JWT, rol ADMIN u OPERATOR
- `DELETE /api/drivers/:id` - requiere JWT, rol ADMIN u OPERATOR

### Telemetria (dispositivos simulados, RF08/RF11)

- `POST /api/telemetry/gps` - requiere header `x-device-key`
- `POST /api/telemetry/obd` - requiere header `x-device-key` (genera alertas
  automaticas en sobrecalentamiento, codigos de falla o voltaje bajo)

### Combustible

- `GET /api/vehicles/:id/fuel-logs` - requiere JWT
- `POST /api/vehicles/:id/fuel-logs` - requiere JWT
- `GET /api/vehicles/:id/fuel-consumption` - requiere JWT

### Mantenimiento

- `GET /api/vehicles/:id/maintenance-schedules` - requiere JWT
- `POST /api/vehicles/:id/maintenance-schedules` - requiere JWT, rol ADMIN u OPERATOR
- `PATCH /api/maintenance-schedules/:id` - requiere JWT, rol ADMIN u OPERATOR
  (al marcar `DONE` crea automaticamente un `MaintenanceRecord`)
- `GET /api/vehicles/:id/maintenance-records` - requiere JWT
- `POST /api/vehicles/:id/maintenance-records` - requiere JWT, rol ADMIN u OPERATOR

### Alertas

- `GET /api/alerts` (`?vehicleId=&unread=true`) - requiere JWT
- `PATCH /api/alerts/:id/read` - requiere JWT

### Dashboard

- `GET /api/dashboard/summary` - requiere JWT

### Reportes

- `GET /api/reports/fleet` (`?from=&to=`) - requiere JWT

## Notas de implementacion

- `GET /api/vehicles/:id/trips` agrupa lecturas GPS consecutivas en
  "viajes" con una heuristica simple documentada en
  `src/utils/trips.ts`: se corta un viaje cuando el intervalo entre dos
  lecturas supera 5 minutos, o cuando la velocidad reportada se mantiene
  cerca de 0 durante varias lecturas seguidas (parada sostenida). La
  distancia de cada viaje es la suma de distancias haversine entre puntos
  consecutivos. Es deliberadamente simple: no hace map-matching ni filtra
  ruido GPS, solo necesita ser funcional para el dashboard/reportes.
- El odometro del vehiculo (`Vehicle.odometerKm`) solo se actualiza desde
  lecturas OBD (`POST /api/telemetry/obd`), nunca desde GPS.
