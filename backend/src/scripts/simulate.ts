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
const TICK_MS = 2000;

// --- Rutas reales sobre calles de Bucaramanga --------------------------
// En vez de un random-walk (que puede "atravesar" manzanas, edificios o
// zonas verdes), cada vehiculo recorre una ruta real obtenida de OSRM
// (Open Source Routing Machine), codificada como polyline de Google.
// Al llegar al final, el vehiculo invierte el sentido y regresa por la
// misma via (ping-pong), asi que nunca abandona una calle real.
const ROUTE_POLYLINES = [
  "olmj@dth}L^Kh@Ou@sCAGgCv@GBMDE@k@PeA\\GBIBoCx@E@GBGBcD`AE@C@G@EBcBd@aCt@E@aBd@g@NMBE@G@IKkBqBEEIIGIWYy@}@MMGGGIEICKk@qBAEAEK]AEESGYESQo@EOEICGEIMOg@g@gAw@QMOOGMCKAEG[BK@O?QEOGMQOUIUCW?O?WAQCCAICMEKGKIIKIQGQEW]yCUkBAA?EGUEUIUGSKWMWKS[c@y@oA]i@_BeCGKQUKQqCoEGKIQEMEOAMAI?I?OM?K?KAq@AsDIOA_FKk@AmBEI?AGCQB{CBkAB{@@SBkA?QD_ByBF_BDcBFKgEEgARSJSDEDEj@i@^Ut@U",
  "}gkj@bej}LvLv@pAHZBhAHl@DrAJH@H@d@D\\DlALJBJ@JDHDFHFHT^VNJBJ?HAHEDCDI@GCMo@aAGGEGc@OICC?E?G?O?{ANO@IAI?SCkAKg@EKAWEyAMWAgAIIAk^_C[A[A[@]@S@}@JmANKBM@WDYDC@{A`@I@IBODoCr@cCn@E@GBMD_EnAc@NKBE@IBI@IBKBsBb@I@G@G?M?CAE?ICuAg@ICICIAKCIAQAI?IAoBGSCQEQCSEMAQ?I?I@K@KBMDm@TKDGBG@G?Q@OAO?SCKEOKGCGIGIGMu@iBEKCIAIAI?GCe@Eg@AMAICKIYKW[w@Q]IQKMKIWQ_@SMKKKIKGKEIEQAK?K?{@@c@?[AQCOI[So@Qi@GMCIIQMSMQ_AqACGCECGAGAK?K@eB@]?O?E?G?OBeC?I?EAGCGEGIG{@aAUUACECIKkBqBEEIIGIWYy@}@MMGGGIEICKk@qBAEAEK]AEESGYESQo@EOEICGEIMOg@g@gAw@QMOOGMCKAEG[BK@O?QEOGMQOUIUCW?O?WAQCCAICMEKGKIIKIQGQEW]yCUkBAA?EGUEUIUGSKWMWKS[c@y@oA]i@_BeCGKQUKQqCoEGKIQEMEOAMAI?I?OAQAg@?I?KCmAAc@ASGoDIcDCQGUGQ?UBSDSFWFSJQJOLO\\]XWlA_AFIFG@E@C@IBQBWBYNaC?MCMGMEGGGEEIEKCKAO?KDMJYXi@h@YXYV[RKHYNYNc@PUFQFWFYDi@Fi@Fa@BQ?S?YAa@E]E}@OUKMGKIGGEEEGAG?G?I@K@KBMNo@DQ@c@?a@AWEQOa@GUAS?QBUDOHQBIDKJSDIRi@FOBGBK@O?OAOCQCU@Q@SBOBKd@_B@I?I?OEMEKo@cA_@g@OWMWMWEIGIKMKIEEIKGIEOEQEQ?SBSFMFKDGfCyBPQFIFMFQt@mEFa@DYDIFILCD?H?D@DBDDBDBFBFBH@J@F?@?FC^EZAJ@HBVDPDJ@BJV@F@D@D?H?JAHAHCHK`@GNEJGFGHCBy@|@CDCDEJCJAN@LDPDLFLFDJHVLPHTHd@NTFH@H@R?LApAOLCHAJCLGh@]rBoAd@[\\QXKb@UNGZMDABCDCLIJMBCDGDG@IDKNq@Pe@H[DS?K?IAIAECGGQIQACAC?EAI?K?O?KBMDIDGDEDENGJEXENCNAn@@R@L?NCNEJGFGJKFKDOBK@KJw@@q@CUAGACGKIIEEICQCUAMAKASAMAIAGAECECCECGAI?OBc@AMAMAECEGKMYGOEKAK?KFWNg@JIhA_@HGHGDIBK?QASCWAU?I@K@G@GBEBCFCDCJAH?J?PJRNJLNHLDLBL@L?LCNEPEJ?H@H@FBLF^XNBNBLDHBDFBFBHBHDHBFDDBFHFbA\\HBHBJBLBL?LC",
  "ojij@`hg}LsDfCw@iAu@gAw@iA}DpCw@kAw@gAu@iAYa@QWMQKOe@q@EGKMMQ[B]BuEXkAHu@FI@_AH[@W@]?O?S?YAa@C[AY?]B[@UBQBwCl@i@JG?G@g@@_CPcCPG@I@O@O@O@W@wDVkDV_@BM@W@mEZ{CRM@I@Y@[By@FgBLG?wDVaF\\I@I?Q@yAJcBNC?E?O@gBLO@]DKBC?E@MBK@SFG@WHUFuAd@QFC?A@QDEBMB}Bn@_Cn@G@GBOBMDuBb@MBKBSDsBh@IBKBUHeBn@w@XIDIBOFuBv@GBIBGBKDu@VSB{@\\_@NqBt@a@Nk@PKDG@M@S?QAOCUIUCW?O?QDODMFKHIJINCJAJ?JBLDLFLFDBP@J?H?NCHAD_@p@eAlBINSb@GRCFa@n@ILwA~BIN}BvDINkB|CQZMROVU^Q^CBABA?GDOEOCQ?O@OBMDMFKHEHGFELENCN?N@NDTHPLP?DADAFCFEHq@fAKPmB`DGJGJBJ@NBNXhC^dD\\vC^~C?B@B@NPAlAO@F\\zC^bD^~C^dD^bDZvCxAOLC",
];

interface RoutePoint {
  lat: number;
  lng: number;
  cumKm: number;
}

// Decodificador estandar del algoritmo Google Polyline (precision 5).
function decodePolyline(encoded: string): [number, number][] {
  let index = 0;
  let lat = 0;
  let lng = 0;
  const coordinates: [number, number][] = [];

  while (index < encoded.length) {
    let shift = 0;
    let result = 0;
    let byte: number;
    do {
      byte = encoded.charCodeAt(index++) - 63;
      result |= (byte & 0x1f) << shift;
      shift += 5;
    } while (byte >= 0x20);
    lat += result & 1 ? ~(result >> 1) : result >> 1;

    shift = 0;
    result = 0;
    do {
      byte = encoded.charCodeAt(index++) - 63;
      result |= (byte & 0x1f) << shift;
      shift += 5;
    } while (byte >= 0x20);
    lng += result & 1 ? ~(result >> 1) : result >> 1;

    coordinates.push([lat / 1e5, lng / 1e5]);
  }
  return coordinates;
}

function buildRoute(encoded: string): RoutePoint[] {
  const raw = decodePolyline(encoded);
  const points: RoutePoint[] = [{ lat: raw[0][0], lng: raw[0][1], cumKm: 0 }];
  for (let i = 1; i < raw.length; i++) {
    const [lat, lng] = raw[i];
    const prev = points[i - 1];
    const dLat = (lat - prev.lat) * 111;
    const dLng = (lng - prev.lng) * 111 * Math.cos((lat * Math.PI) / 180);
    const segKm = Math.sqrt(dLat * dLat + dLng * dLng);
    points.push({ lat, lng, cumKm: prev.cumKm + segKm });
  }
  return points;
}

const ROUTES: RoutePoint[][] = ROUTE_POLYLINES.map(buildRoute);

// Convierte una distancia acumulada (posiblemente mayor que el largo de
// la ruta) en un punto sobre la via, rebotando de ida y vuelta en los
// extremos para no salirse nunca de la calle real.
function positionAtDistance(route: RoutePoint[], distanceKm: number): { lat: number; lng: number } {
  const totalKm = route[route.length - 1].cumKm;
  if (totalKm <= 0) return { lat: route[0].lat, lng: route[0].lng };

  let d = distanceKm % (2 * totalKm);
  if (d < 0) d += 2 * totalKm;
  if (d > totalKm) d = 2 * totalKm - d;

  for (let i = 1; i < route.length; i++) {
    if (d <= route[i].cumKm) {
      const a = route[i - 1];
      const b = route[i];
      const segLen = b.cumKm - a.cumKm;
      const t = segLen === 0 ? 0 : (d - a.cumKm) / segLen;
      return { lat: a.lat + (b.lat - a.lat) * t, lng: a.lng + (b.lng - a.lng) * t };
    }
  }
  const last = route[route.length - 1];
  return { lat: last.lat, lng: last.lng };
}

interface SimState {
  vehicleId: number;
  plate: string;
  route: RoutePoint[];
  routeDistanceKm: number;
  lat: number;
  lng: number;
  speedKph: number;
  targetSpeedKph: number;
  ticksUntilNewTarget: number;
  odometerKm: number;
  tick: number;
}

function randomBetween(min: number, max: number): number {
  return min + Math.random() * (max - min);
}

// Aceleracion/frenado maximo por tick (kph). Con TICK_MS=2000 esto equivale
// a una aceleracion de ~3 km/h por segundo, similar a un camion real
// (no puede pasar de 0 a 60 de un salto, ni frenar en seco).
const MAX_SPEED_STEP_KPH = 6;

function advance(state: SimState) {
  // Modelo de velocidad "hacia un objetivo": el vehiculo no salta a un
  // valor aleatorio cada tick, sino que acelera/frena gradualmente hacia
  // una velocidad objetivo que cambia cada tanto -a veces 0 (semaforo,
  // trafico detenido), la mayoria de las veces una velocidad de crucero-.
  // Asi se ve un patron real: sube, se mantiene, baja a 0, vuelve a subir.
  state.ticksUntilNewTarget -= 1;
  if (state.ticksUntilNewTarget <= 0) {
    state.targetSpeedKph = Math.random() < 0.25 ? 0 : randomBetween(15, 70);
    state.ticksUntilNewTarget = Math.round(randomBetween(4, 12)); // 8-24s por objetivo
  }

  const diff = state.targetSpeedKph - state.speedKph;
  const step = Math.max(-MAX_SPEED_STEP_KPH, Math.min(MAX_SPEED_STEP_KPH, diff));
  state.speedKph = Math.min(85, Math.max(0, state.speedKph + step + randomBetween(-0.8, 0.8)));

  const distanceKm = (state.speedKph * (TICK_MS / 1000)) / 3600;
  state.routeDistanceKm += distanceKm;
  state.odometerKm += distanceKm;

  const pos = positionAtDistance(state.route, state.routeDistanceKm);
  state.lat = pos.lat;
  state.lng = pos.lng;
}

// El RPM debe corresponder a la velocidad: en ralenti (detenido, motor
// encendido) ronda 650-900; a medida que sube la velocidad, sube el RPM
// dentro de un rango realista para un motor diesel de carga pesada.
function rpmForSpeed(speedKph: number): number {
  if (speedKph < 1) {
    return Math.round(randomBetween(650, 900));
  }
  const base = 750 + speedKph * 18; // ~750 en ralenti alto, ~2280 a 85kph
  return Math.round(Math.min(2400, Math.max(750, base + randomBetween(-70, 70))));
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
  // Detenido no implica motor apagado (semaforo, trafico); en movimiento
  // el motor siempre esta encendido.
  const engineOn = state.speedKph > 0.5 ? true : Math.random() > 0.15;
  const rpm = engineOn ? rpmForSpeed(state.speedKph) : 0;

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
  console.log(`Rutas reales cargadas: ${ROUTES.length} (Bucaramanga, via OSRM)`);

  const states: SimState[] = vehicles.map((v, i) => {
    const route = ROUTES[i % ROUTES.length];
    const totalKm = route[route.length - 1].cumKm;
    const startDistanceKm = randomBetween(0, totalKm);
    const pos = positionAtDistance(route, startDistanceKm);
    return {
      vehicleId: v.id,
      plate: v.plate,
      route,
      routeDistanceKm: startDistanceKm,
      lat: pos.lat,
      lng: pos.lng,
      speedKph: randomBetween(10, 40),
      targetSpeedKph: randomBetween(15, 70),
      ticksUntilNewTarget: Math.round(randomBetween(4, 12)),
      odometerKm: v.odometerKm,
      tick: 0,
    };
  });

  // We no longer need the Prisma connection after loading the vehicle list.
  await prisma.$disconnect();

  setInterval(async () => {
    for (const state of states) {
      state.tick += 1;
      advance(state);

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
