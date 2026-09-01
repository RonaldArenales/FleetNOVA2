import { Router } from "express";
import { prisma } from "../../lib/prisma";
import { asyncHandler } from "../../utils/asyncHandler";

const router = Router();

// GET /api/public/demo-vehicle
// Vista publica y de solo lectura de un vehiculo de ejemplo, usada
// unicamente por el mapa de muestra de la pagina principal. No requiere
// autenticacion y no expone datos sensibles (VIN, conductor asignado,
// odometro): solo placa, marca/modelo, posicion y velocidad actuales.
router.get(
  "/demo-vehicle",
  asyncHandler(async (_req, res) => {
    const vehicle = await prisma.vehicle.findFirst({
      where: { status: "ACTIVE" },
      orderBy: { createdAt: "asc" },
    });

    if (!vehicle) {
      res.json(null);
      return;
    }

    const gps = await prisma.gpsReading.findFirst({
      where: { vehicleId: vehicle.id },
      orderBy: { timestamp: "desc" },
    });

    res.json({
      plate: vehicle.plate,
      brand: vehicle.brand,
      model: vehicle.model,
      lat: gps?.lat ?? null,
      lng: gps?.lng ?? null,
      speedKph: gps?.speedKph ?? null,
      updatedAt: gps?.timestamp ?? null,
    });
  })
);

export default router;
