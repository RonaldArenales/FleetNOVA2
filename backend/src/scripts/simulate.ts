import "dotenv/config";
import { PrismaClient, VehicleStatus } from "@prisma/client";

// Standalone script: reads ACTIVE vehicles from the DB and simulates
// GPS + OBD-II telemetry by POSTing to the running dev server's
// /api/telemetry/* endpoints, exactly like a real device would.
// Run the dev server first (`npm run dev`), then in another terminal:
// `npm run simulate`.

const prisma = new PrismaClient();

const PORT = process.env.PORT || "4000";
const BASE_URL = `http://localhost:${PORT}`;
const DEVICE_API_KEY = process.env.DEVICE_API_KEY || "changeme-device-key";
const TICK_MS = 5000;

// Starting point near Bucaramanga, Colombia.
const START_LAT = 7.119;
const START_LNG = -73.122;

interface SimState {
  vehicleId: string;
  plate: string;
  lat: number;
  lng: number;
  speedKph: number;
  odometerKm: number;
  tick: number;
}

function randomBetween(min: number, max: number): number {
  return min + Math.random() * (max - min);
}

function randomWalk(state: SimState) {
  // Small random walk in lat/lng plus a plausible speed change.
  const speedDelta = randomBetween(-10, 10);
  state.speedKph = Math.min(90, Math.max(0, state.speedKph + speedDelta));

  // Convert speed (kph) over TICK_MS into an approximate lat/lng delta.
  const distanceKm = (state.speedKph * (TICK_MS / 1000)) / 3600;
  const bearing = randomBetween(0, 2 * Math.PI);
  const dLat = ((distanceKm / 111) * Math.cos(bearing));
  const dLng =
    (distanceKm / (111 * Math.cos((state.lat * Math.PI) / 180))) * Math.sin(bearing);

  state.lat += dLat;
  state.lng += dLng;
  state.odometerKm += distanceKm;
}

async function postGps(state: SimState) {
  const res = await fetch(`${BASE_URL}/api/telemetry/gps`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-device-key": DEVICE_API_KEY,
    },
    body: JSON.stringify({
      vehicleId: state.vehicleId,
      lat: state.lat,
      lng: state.lng,
      speedKph: state.speedKph,
    }),
  });
  return res.ok;
}

async function postObd(state: SimState) {
  const engineOn = state.speedKph > 0 || Math.random() > 0.5;
  const rpm = engineOn ? Math.round(randomBetween(700, 2500)) : 0;

  let engineTempC = randomBetween(80, 95);
  if (Math.random() < 0.05) {
    engineTempC = randomBetween(106, 115); // ~5% chance of overheating spike
  }

  let batteryVoltage = randomBetween(12, 14.4);
  if (Math.random() < 0.05) {
    batteryVoltage = randomBetween(11.0, 11.4); // occasional low-battery dip
  }

  let faultCodes: string[] = [];
  if (Math.random() < 0.03) {
    faultCodes = Math.random() < 0.5 ? ["P0301"] : ["P0420"]; // ~3% chance
  }

  const res = await fetch(`${BASE_URL}/api/telemetry/obd`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-device-key": DEVICE_API_KEY,
    },
    body: JSON.stringify({
      vehicleId: state.vehicleId,
      rpm,
      engineTempC,
      batteryVoltage,
      transmissionOk: true,
      engineOn,
      odometerKm: state.odometerKm,
      faultCodes,
    }),
  });
  return { ok: res.ok, engineTempC, batteryVoltage, faultCodes };
}

async function main() {
  const vehicles = await prisma.vehicle.findMany({ where: { status: VehicleStatus.ACTIVE } });

  if (vehicles.length === 0) {
    console.log("No hay vehiculos ACTIVOS en la base de datos. Ejecuta `npm run seed` primero.");
    await prisma.$disconnect();
    return;
  }

  console.log(`Simulando telemetria para ${vehicles.length} vehiculo(s) activo(s).`);
  console.log(`Servidor destino: ${BASE_URL}`);

  const states: SimState[] = vehicles.map((v) => ({
    vehicleId: v.id,
    plate: v.plate,
    lat: START_LAT + randomBetween(-0.02, 0.02),
    lng: START_LNG + randomBetween(-0.02, 0.02),
    speedKph: randomBetween(0, 40),
    odometerKm: v.odometerKm,
    tick: 0,
  }));

  // We no longer need the Prisma connection after loading the vehicle list.
  await prisma.$disconnect();

  setInterval(async () => {
    for (const state of states) {
      state.tick += 1;
      randomWalk(state);

      try {
        const gpsOk = await postGps(state);
        let obdSummary = "";
        if (state.tick % 3 === 0) {
          const obd = await postObd(state);
          const flags: string[] = [];
          if (obd.engineTempC > 105) flags.push("TEMP_ALTA");
          if (obd.batteryVoltage < 11.5) flags.push("BATERIA_BAJA");
          if (obd.faultCodes.length) flags.push(`FALLA:${obd.faultCodes.join(",")}`);
          obdSummary = ` | OBD ${obd.ok ? "ok" : "ERROR"} temp=${obd.engineTempC.toFixed(1)}C bat=${obd.batteryVoltage.toFixed(1)}V${
            flags.length ? " [" + flags.join(", ") + "]" : ""
          }`;
        }

        console.log(
          `[${state.plate}] tick=${state.tick} GPS ${gpsOk ? "ok" : "ERROR"} lat=${state.lat.toFixed(
            5
          )} lng=${state.lng.toFixed(5)} speed=${state.speedKph.toFixed(1)}kph odo=${state.odometerKm.toFixed(
            1
          )}km${obdSummary}`
        );
      } catch (err) {
        console.error(`[${state.plate}] error enviando telemetria:`, (err as Error).message);
      }
    }
  }, TICK_MS);

  console.log(`Simulador iniciado. Enviando telemetria cada ${TICK_MS / 1000}s. Ctrl+C para detener.`);
}

main().catch((err) => {
  console.error("Error fatal en el simulador:", err);
  process.exit(1);
});
