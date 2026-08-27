import { Router } from "express";
import { z } from "zod";
import { MaintenanceStatus } from "@prisma/client";
import { prisma } from "../../lib/prisma";
import { validateBody } from "../../utils/validate";
import { asyncHandler } from "../../utils/asyncHandler";
import { requireAuth, requireRole } from "../../middleware/auth";
import { notFound } from "../../utils/httpError";

// Mounted at /api/vehicles/:id in index.ts (mergeParams needed to read :id).
export const vehicleMaintenanceRouter = Router({ mergeParams: true });
vehicleMaintenanceRouter.use(requireAuth);

const scheduleCreateSchema = z.object({
  type: z.string().min(1, "El tipo es requerido"),
  dueDate: z.string().datetime().optional(),
  dueOdometerKm: z.number().optional(),
  description: z.string().optional(),
  status: z.nativeEnum(MaintenanceStatus).optional(),
});

const recordCreateSchema = z.object({
  type: z.string().min(1, "El tipo es requerido"),
  description: z.string().optional(),
  cost: z.number().optional(),
  odometerKm: z.number(),
  performedAt: z.string().datetime().optional(),
});

// GET /api/vehicles/:id/maintenance-schedules
vehicleMaintenanceRouter.get(
  "/maintenance-schedules",
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    const vehicle = await prisma.vehicle.findUnique({ where: { id } });
    if (!vehicle) throw notFound("Vehiculo no encontrado");

    const schedules = await prisma.maintenanceSchedule.findMany({
      where: { vehicleId: id },
      orderBy: { createdAt: "desc" },
    });
    res.json(schedules);
  })
);

// POST /api/vehicles/:id/maintenance-schedules
vehicleMaintenanceRouter.post(
  "/maintenance-schedules",
  requireRole("ADMIN", "OPERATOR"),
  validateBody(scheduleCreateSchema),
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    const vehicle = await prisma.vehicle.findUnique({ where: { id } });
    if (!vehicle) throw notFound("Vehiculo no encontrado");

    const { type, dueDate, dueOdometerKm, description, status } = req.body as z.infer<
      typeof scheduleCreateSchema
    >;
    const schedule = await prisma.maintenanceSchedule.create({
      data: {
        vehicleId: id,
        type,
        dueDate: dueDate ? new Date(dueDate) : undefined,
        dueOdometerKm,
        description,
        status: status ?? MaintenanceStatus.SCHEDULED,
      },
    });
    res.status(201).json(schedule);
  })
);

// GET /api/vehicles/:id/maintenance-records
vehicleMaintenanceRouter.get(
  "/maintenance-records",
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    const vehicle = await prisma.vehicle.findUnique({ where: { id } });
    if (!vehicle) throw notFound("Vehiculo no encontrado");

    const records = await prisma.maintenanceRecord.findMany({
      where: { vehicleId: id },
      orderBy: { performedAt: "desc" },
    });
    res.json(records);
  })
);

// POST /api/vehicles/:id/maintenance-records
vehicleMaintenanceRouter.post(
  "/maintenance-records",
  requireRole("ADMIN", "OPERATOR"),
  validateBody(recordCreateSchema),
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    const vehicle = await prisma.vehicle.findUnique({ where: { id } });
    if (!vehicle) throw notFound("Vehiculo no encontrado");

    const { type, description, cost, odometerKm, performedAt } = req.body as z.infer<
      typeof recordCreateSchema
    >;
    const record = await prisma.maintenanceRecord.create({
      data: {
        vehicleId: id,
        type,
        description,
        cost,
        odometerKm,
        ...(performedAt ? { performedAt: new Date(performedAt) } : {}),
      },
    });
    res.status(201).json(record);
  })
);

// ---------------------------------------------------------------------

// Mounted at /api/maintenance-schedules in index.ts.
export const maintenanceSchedulesRouter = Router();
maintenanceSchedulesRouter.use(requireAuth);

const scheduleUpdateSchema = z.object({
  type: z.string().optional(),
  dueDate: z.string().datetime().optional(),
  dueOdometerKm: z.number().optional(),
  description: z.string().optional(),
  status: z.nativeEnum(MaintenanceStatus).optional(),
});

// PATCH /api/maintenance-schedules/:id
maintenanceSchedulesRouter.patch(
  "/:id",
  requireRole("ADMIN", "OPERATOR"),
  validateBody(scheduleUpdateSchema),
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    const existing = await prisma.maintenanceSchedule.findUnique({ where: { id } });
    if (!existing) throw notFound("Programacion de mantenimiento no encontrada");

    const { dueDate, ...rest } = req.body as z.infer<typeof scheduleUpdateSchema>;

    const updated = await prisma.maintenanceSchedule.update({
      where: { id },
      data: {
        ...rest,
        ...(dueDate ? { dueDate: new Date(dueDate) } : {}),
      },
    });

    // Al marcar como DONE, se crea automaticamente el registro de mantenimiento.
    if (rest.status === MaintenanceStatus.DONE && existing.status !== MaintenanceStatus.DONE) {
      const vehicle = await prisma.vehicle.findUnique({ where: { id: existing.vehicleId } });
      await prisma.maintenanceRecord.create({
        data: {
          vehicleId: existing.vehicleId,
          type: updated.type,
          description: updated.description ?? undefined,
          odometerKm: vehicle?.odometerKm ?? existing.dueOdometerKm ?? 0,
        },
      });
    }

    res.json(updated);
  })
);

export default vehicleMaintenanceRouter;
