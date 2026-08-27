import { Router } from "express";
import { Prisma } from "@prisma/client";
import { prisma } from "../../lib/prisma";
import { asyncHandler } from "../../utils/asyncHandler";
import { requireAuth } from "../../middleware/auth";
import { notFound } from "../../utils/httpError";

const router = Router();

router.use(requireAuth);

// GET /api/alerts?vehicleId=&unread=true
router.get(
  "/",
  asyncHandler(async (req, res) => {
    const vehicleId = req.query.vehicleId as string | undefined;
    const unread = req.query.unread as string | undefined;

    const where: Prisma.AlertWhereInput = {};
    if (vehicleId) where.vehicleId = vehicleId;
    if (unread === "true") where.read = false;

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
    const { id } = req.params;
    const existing = await prisma.alert.findUnique({ where: { id } });
    if (!existing) throw notFound("Alerta no encontrada");

    const alert = await prisma.alert.update({ where: { id }, data: { read: true } });
    res.json(alert);
  })
);

export default router;
