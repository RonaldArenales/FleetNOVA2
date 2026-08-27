import { Router } from "express";
import { z } from "zod";
import { prisma } from "../../lib/prisma";
import { validateBody } from "../../utils/validate";
import { asyncHandler } from "../../utils/asyncHandler";
import { requireAuth, requireRole } from "../../middleware/auth";
import { notFound } from "../../utils/httpError";

const router = Router();

router.use(requireAuth);

const driverCreateSchema = z.object({
  name: z.string().min(1, "El nombre es requerido"),
  documentId: z.string().min(1, "El numero de documento es requerido"),
  licenseNumber: z.string().min(1, "El numero de licencia es requerido"),
  phone: z.string().optional(),
});

const driverUpdateSchema = driverCreateSchema.partial();

// GET /api/drivers
router.get(
  "/",
  asyncHandler(async (_req, res) => {
    const drivers = await prisma.driver.findMany({ orderBy: { createdAt: "asc" } });
    res.json(drivers);
  })
);

// POST /api/drivers
router.post(
  "/",
  requireRole("ADMIN", "OPERATOR"),
  validateBody(driverCreateSchema),
  asyncHandler(async (req, res) => {
    const driver = await prisma.driver.create({ data: req.body });
    res.status(201).json(driver);
  })
);

// PATCH /api/drivers/:id
router.patch(
  "/:id",
  requireRole("ADMIN", "OPERATOR"),
  validateBody(driverUpdateSchema),
  asyncHandler(async (req, res) => {
    const existing = await prisma.driver.findUnique({ where: { id: req.params.id } });
    if (!existing) throw notFound("Conductor no encontrado");

    const driver = await prisma.driver.update({ where: { id: req.params.id }, data: req.body });
    res.json(driver);
  })
);

// DELETE /api/drivers/:id
router.delete(
  "/:id",
  requireRole("ADMIN", "OPERATOR"),
  asyncHandler(async (req, res) => {
    const existing = await prisma.driver.findUnique({ where: { id: req.params.id } });
    if (!existing) throw notFound("Conductor no encontrado");
    await prisma.driver.delete({ where: { id: req.params.id } });
    res.status(204).send();
  })
);

export default router;
