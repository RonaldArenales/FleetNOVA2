import { Router } from "express";
import { z } from "zod";
import { AlertLevel } from "@prisma/client";
import { prisma } from "../../lib/prisma";
import { validateBody } from "../../utils/validate";
import { asyncHandler } from "../../utils/asyncHandler";
import { requireDeviceKey } from "../../middleware/deviceAuth";
import { notFound } from "../../utils/httpError";

const router = Router();

// Telemetry ingestion simulates real GPS/OBD-II devices, so it is
// authenticated with a shared device key instead of a user JWT.
router.use(requireDeviceKey);

const gpsSchema = z.object({
  vehicleId: z.string().min(1),
  lat: z.number(),
  lng: z.number(),
  speedKph: z.number(),
  timestamp: z.string().datetime().optional(),
});

const obdSchema = z.object({
  vehicleId: z.string().min(1),
  rpm: z.number().int(),
  engineTempC: z.number(),
  batteryVoltage: z.number(),
  transmissionOk: z.boolean().optional(),
  engineOn: z.boolean(),
  odometerKm: z.number(),
  faultCodes: z.array(z.string()).optional(),
  timestamp: z.string().datetime().optional(),
});

// POST /api/telemetry/gps
router.post(
  "/gps",
  validateBody(gpsSchema),
  asyncHandler(async (req, res) => {
    const { vehicleId, lat, lng, speedKph, timestamp } = req.body as z.infer<typeof gpsSchema>;

    const vehicle = await prisma.vehicle.findUnique({ where: { id: vehicleId } });
    if (!vehicle) throw notFound("Vehiculo no encontrado");

    // El odometro solo se actualiza desde lecturas OBD, no desde GPS.
    const reading = await prisma.gpsReading.create({
      data: {
        vehicleId,
        lat,
        lng,
        speedKph,
        ...(timestamp ? { timestamp: new Date(timestamp) } : {}),
      },
    });

    res.status(201).json(reading);
  })
);

// POST /api/telemetry/obd
router.post(
  "/obd",
  validateBody(obdSchema),
  asyncHandler(async (req, res) => {
    const {
      vehicleId,
      rpm,
      engineTempC,
      batteryVoltage,
      transmissionOk,
      engineOn,
      odometerKm,
      faultCodes,
      timestamp,
    } = req.body as z.infer<typeof obdSchema>;

    const vehicle = await prisma.vehicle.findUnique({ where: { id: vehicleId } });
    if (!vehicle) throw notFound("Vehiculo no encontrado");

    const reading = await prisma.obdReading.create({
      data: {
        vehicleId,
        rpm,
        engineTempC,
        batteryVoltage,
        transmissionOk: transmissionOk ?? true,
        engineOn,
        odometerKm,
        faultCodes: faultCodes ?? [],
        ...(timestamp ? { timestamp: new Date(timestamp) } : {}),
      },
    });

    // Mantiene el odometro del vehiculo sincronizado con la ultima lectura OBD.
    await prisma.vehicle.update({
      where: { id: vehicleId },
      data: { odometerKm },
    });

    // RF08/RF11 - genera alertas automaticas a partir de la telemetria.
    const codes = faultCodes ?? [];
    const alertsToCreate: { level: AlertLevel; message: string }[] = [];

    if (codes.length > 0) {
      alertsToCreate.push({
        level: AlertLevel.CRITICAL,
        message: `Codigo de falla detectado: ${codes.join(", ")}`,
      });
    }
    if (engineTempC > 105) {
      alertsToCreate.push({
        level: AlertLevel.CRITICAL,
        message: `Temperatura del motor elevada: ${engineTempC}°C`,
      });
    }
    if (batteryVoltage < 11.5) {
      alertsToCreate.push({
        level: AlertLevel.WARNING,
        message: `Voltaje de bateria bajo: ${batteryVoltage}V`,
      });
    }

    if (alertsToCreate.length > 0) {
      await prisma.alert.createMany({
        data: alertsToCreate.map((a) => ({ vehicleId, level: a.level, message: a.message })),
      });
    }

    res.status(201).json(reading);
  })
);

export default router;
