import { Router } from "express";
import { z } from "zod";
import { VehicleStatus, Prisma } from "@prisma/client";
import { prisma } from "../../lib/prisma";
import { validateBody } from "../../utils/validate";
import { asyncHandler } from "../../utils/asyncHandler";
import { requireAuth, requireRole, requireStaff } from "../../middleware/auth";
import { badRequest, notFound } from "../../utils/httpError";
import { computeTrips } from "../../utils/trips";

const router = Router();

// All routes require a logged-in user; writes are additionally
// restricted to ADMIN/OPERATOR below.
router.use(requireAuth, requireStaff);

function parseVehicleId(raw: string): number {
  const id = Number(raw);
  if (!Number.isInteger(id)) throw badRequest("Identificador de vehiculo invalido");
  return id;
}

const vehicleCreateSchema = z.object({
  plate: z.string().min(1, "La placa es requerida"),
  brand: z.string().min(1, "La marca es requerida"),
  model: z.string().min(1, "El modelo es requerido"),
  year: z.number().int(),
  vin: z.string().optional(),
  status: z.nativeEnum(VehicleStatus).optional(),
  odometerKm: z.number().optional(),
  tireInstalledKm: z.number().optional(),
  tireLifeKm: z.number().optional(),
});

const vehicleUpdateSchema = vehicleCreateSchema.partial();

const assignDriverSchema = z.object({
  driverId: z.coerce.number().int("driverId debe ser un numero"),
});

// GET /api/vehicles?plate=&status=   (RF13 - filtro de vehiculos)
router.get(
  "/",
  asyncHandler(async (req, res) => {
    const plate = req.query.plate as string | undefined;
    const status = req.query.status as string | undefined;

    const where: Prisma.VehicleWhereInput = {};
    if (plate) {
      where.plate = { contains: plate, mode: "insensitive" };
    }
    if (status) {
      if (!Object.values(VehicleStatus).includes(status as VehicleStatus)) {
        throw badRequest("Estado de vehiculo invalido");
      }
      where.status = status as VehicleStatus;
    }

    const vehicles = await prisma.vehicle.findMany({
      where,
      orderBy: { createdAt: "asc" },
    });
    res.json(vehicles);
  })
);

// GET /api/vehicles/:id
router.get(
  "/:id",
  asyncHandler(async (req, res) => {
    const id = parseVehicleId(req.params.id);
    const vehicle = await prisma.vehicle.findUnique({ where: { id } });
    if (!vehicle) throw notFound("Vehiculo no encontrado");
    res.json(vehicle);
  })
);

// POST /api/vehicles
router.post(
  "/",
  requireRole("ADMIN", "OPERATOR"),
  validateBody(vehicleCreateSchema),
  asyncHandler(async (req, res) => {
    const vehicle = await prisma.vehicle.create({ data: req.body });
    res.status(201).json(vehicle);
  })
);

// PATCH /api/vehicles/:id
router.patch(
  "/:id",
  requireRole("ADMIN", "OPERATOR"),
  validateBody(vehicleUpdateSchema),
  asyncHandler(async (req, res) => {
    const id = parseVehicleId(req.params.id);
    const existing = await prisma.vehicle.findUnique({ where: { id } });
    if (!existing) throw notFound("Vehiculo no encontrado");

    const vehicle = await prisma.vehicle.update({
      where: { id },
      data: req.body,
    });
    res.json(vehicle);
  })
);

// DELETE /api/vehicles/:id
router.delete(
  "/:id",
  requireRole("ADMIN", "OPERATOR"),
  asyncHandler(async (req, res) => {
    const id = parseVehicleId(req.params.id);
    const existing = await prisma.vehicle.findUnique({ where: { id } });
    if (!existing) throw notFound("Vehiculo no encontrado");
    await prisma.vehicle.delete({ where: { id } });
    res.status(204).send();
  })
);

// GET /api/vehicles/:id/status - vista unificada GPS + OBD-II (RF15)
router.get(
  "/:id/status",
  asyncHandler(async (req, res) => {
    const id = parseVehicleId(req.params.id);
    const vehicle = await prisma.vehicle.findUnique({ where: { id } });
    if (!vehicle) throw notFound("Vehiculo no encontrado");

    const [gps, obd] = await Promise.all([
      prisma.gpsReading.findFirst({ where: { vehicleId: id }, orderBy: { timestamp: "desc" } }),
      prisma.obdReading.findFirst({ where: { vehicleId: id }, orderBy: { timestamp: "desc" } }),
    ]);

    res.json({ vehicleId: id, gps: gps ?? null, obd: obd ?? null });
  })
);

// GET /api/vehicles/:id/tire-wear
router.get(
  "/:id/tire-wear",
  asyncHandler(async (req, res) => {
    const id = parseVehicleId(req.params.id);
    const vehicle = await prisma.vehicle.findUnique({ where: { id } });
    if (!vehicle) throw notFound("Vehiculo no encontrado");

    const kmSinceInstalled = Math.max(0, vehicle.odometerKm - vehicle.tireInstalledKm);
    const rawPercent = vehicle.tireLifeKm > 0 ? (kmSinceInstalled / vehicle.tireLifeKm) * 100 : 0;
    const wearPercent = Math.min(100, Math.max(0, rawPercent));
    const remainingKm = Math.max(0, vehicle.tireLifeKm - kmSinceInstalled);

    res.json({
      kmSinceInstalled,
      tireLifeKm: vehicle.tireLifeKm,
      wearPercent,
      remainingKm,
    });
  })
);

// GET /api/vehicles/:id/gps-history?from=&to=&limit=
router.get(
  "/:id/gps-history",
  asyncHandler(async (req, res) => {
    const id = parseVehicleId(req.params.id);
    const from = req.query.from as string | undefined;
    const to = req.query.to as string | undefined;
    const limit = req.query.limit as string | undefined;

    const vehicle = await prisma.vehicle.findUnique({ where: { id } });
    if (!vehicle) throw notFound("Vehiculo no encontrado");

    const where: Prisma.GpsReadingWhereInput = { vehicleId: id };
    const timestamp: Prisma.DateTimeFilter = {};
    if (from) timestamp.gte = new Date(from);
    if (to) timestamp.lte = new Date(to);
    if (Object.keys(timestamp).length) where.timestamp = timestamp;

    const take = limit ? Math.min(2000, Math.max(1, parseInt(limit, 10) || 200)) : 200;

    const readings = await prisma.gpsReading.findMany({
      where,
      orderBy: { timestamp: "desc" },
      take,
    });
    res.json(readings);
  })
);

// GET /api/vehicles/:id/trips
// Ver src/utils/trips.ts para la heuristica usada para agrupar puntos GPS en viajes.
router.get(
  "/:id/trips",
  asyncHandler(async (req, res) => {
    const id = parseVehicleId(req.params.id);
    const vehicle = await prisma.vehicle.findUnique({ where: { id } });
    if (!vehicle) throw notFound("Vehiculo no encontrado");

    const readings = await prisma.gpsReading.findMany({
      where: { vehicleId: id },
      orderBy: { timestamp: "asc" },
    });

    const trips = computeTrips(
      readings.map((r) => ({ lat: r.lat, lng: r.lng, speedKph: r.speedKph, timestamp: r.timestamp }))
    );

    res.json(trips);
  })
);

// POST /api/vehicles/:id/assign-driver
router.post(
  "/:id/assign-driver",
  requireRole("ADMIN", "OPERATOR"),
  validateBody(assignDriverSchema),
  asyncHandler(async (req, res) => {
    const id = parseVehicleId(req.params.id);
    const { driverId } = req.body as z.infer<typeof assignDriverSchema>;

    const [vehicle, driver] = await Promise.all([
      prisma.vehicle.findUnique({ where: { id } }),
      prisma.driver.findUnique({ where: { id: driverId } }),
    ]);
    if (!vehicle) throw notFound("Vehiculo no encontrado");
    if (!driver) throw notFound("Conductor no encontrado");

    await prisma.vehicleDriver.updateMany({
      where: { vehicleId: id, active: true },
      data: { active: false },
    });

    const assignment = await prisma.vehicleDriver.create({
      data: { vehicleId: id, driverId, active: true },
    });

    res.status(201).json(assignment);
  })
);

export default router;
