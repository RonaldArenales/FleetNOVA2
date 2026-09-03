import { Router } from "express";
import { Prisma } from "@prisma/client";
import { prisma } from "../../lib/prisma";
import { asyncHandler } from "../../utils/asyncHandler";
import { requireAuth, requireStaff } from "../../middleware/auth";
import { badRequest, notFound } from "../../utils/httpError";
import { getVehicleScope, inScope } from "../../utils/vehicleScope";

const router = Router();

router.use(requireAuth, requireStaff);

// GET /api/alerts?vehicleId=&unread=true
router.get(
  "/",
  asyncHandler(async (req, res) => {
    const vehicleId = req.query.vehicleId as string | undefined;
    const unread = req.query.unread as string | undefined;

    const where: Prisma.AlertWhereInput = {};
    if (vehicleId) where.vehicleId = Number(vehicleId);
    if (unread === "true") where.read = false;

    const scope = await getVehicleScope(req.user!);
    if (scope) where.vehicle = { ownerId: scope.ownerId };

    const alerts = await prisma.alert.findMany({
      where,
      orderBy: { createdAt: "desc" },
    });
    res.json(alerts);
  })
);

// PATCH /api/alerts/:id/read
router.patch(
  "/:id/read",
  asyncHandler(async (req, res) => {
    const id = Number(req.params.id);
    if (!Number.isInteger(id)) throw badRequest("Identificador de alerta invalido");

    const existing = await prisma.alert.findUnique({ where: { id }, include: { vehicle: true } });
    const scope = await getVehicleScope(req.user!);
    if (!existing || !inScope(existing.vehicle.ownerId, scope)) throw notFound("Alerta no encontrada");

    const alert = await prisma.alert.update({ where: { id }, data: { read: true } });
    res.json(alert);
  })
);

export default router;
