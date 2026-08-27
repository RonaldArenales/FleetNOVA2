import { Router } from "express";
import { z } from "zod";
import { prisma } from "../../lib/prisma";
import { validateBody } from "../../utils/validate";
import { asyncHandler } from "../../utils/asyncHandler";
import { requireAuth } from "../../middleware/auth";
import { notFound } from "../../utils/httpError";

// Mounted at /api/vehicles/:id/fuel-... in index.ts (mergeParams needed).
const router = Router({ mergeParams: true });

router.use(requireAuth);

const fuelLogSchema = z.object({
  litersAdded: z.number().positive("litersAdded debe ser mayor que 0"),
  cost: z.number().optional(),
  odometerAtFill: z.number(),
});

// GET /api/vehicles/:id/fuel-logs
router.get(
  "/fuel-logs",
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    const vehicle = await prisma.vehicle.findUnique({ where: { id } });
    if (!vehicle) throw notFound("Vehiculo no encontrado");

    const logs = await prisma.fuelLog.findMany({
      where: { vehicleId: id },
      orderBy: { timestamp: "desc" },
    });
    res.json(logs);
  })
);

// POST /api/vehicles/:id/fuel-logs
router.post(
  "/fuel-logs",
  validateBody(fuelLogSchema),
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    const vehicle = await prisma.vehicle.findUnique({ where: { id } });
    if (!vehicle) throw notFound("Vehiculo no encontrado");

    const { litersAdded, cost, odometerAtFill } = req.body as z.infer<typeof fuelLogSchema>;
    const log = await prisma.fuelLog.create({
      data: { vehicleId: id, litersAdded, cost, odometerAtFill },
    });
    res.status(201).json(log);
  })
);

// GET /api/vehicles/:id/fuel-consumption
router.get(
  "/fuel-consumption",
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    const vehicle = await prisma.vehicle.findUnique({ where: { id } });
    if (!vehicle) throw notFound("Vehiculo no encontrado");

    const logs = await prisma.fuelLog.findMany({
      where: { vehicleId: id },
      orderBy: { timestamp: "desc" },
      take: 2,
    });

    if (logs.length < 2) {
      return res.json({
        kmPerLiter: null,
        litersPer100Km: null,
        message: "No hay suficientes registros de combustible para calcular el consumo",
      });
    }

    const [latest, previous] = logs;
    const distanceKm = latest.odometerAtFill - previous.odometerAtFill;

    if (distanceKm <= 0 || latest.litersAdded <= 0) {
      return res.json({
        kmPerLiter: null,
        litersPer100Km: null,
        message: "Datos insuficientes o inconsistentes para calcular el consumo",
      });
    }

    const kmPerLiter = distanceKm / latest.litersAdded;
    const litersPer100Km = (latest.litersAdded / distanceKm) * 100;

    res.json({ kmPerLiter, litersPer100Km, distanceKm, litersAdded: latest.litersAdded });
  })
);

export default router;
