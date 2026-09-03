import { Router } from "express";
import { z } from "zod";
import { prisma } from "../../lib/prisma";
import { validateBody } from "../../utils/validate";
import { asyncHandler } from "../../utils/asyncHandler";
import { requireAuth, requireRole, requireStaff } from "../../middleware/auth";
import { notFound, badRequest } from "../../utils/httpError";
import { getVehicleScope, inScope } from "../../utils/vehicleScope";

const router = Router();

router.use(requireAuth, requireStaff);

async function getDriverInScope(id: number, req: import("express").Request) {
  const driver = await prisma.driver.findUnique({ where: { id } });
  const scope = await getVehicleScope(req.user!);
  if (!driver || !inScope(driver.ownerId, scope)) throw notFound("Conductor no encontrado");
  return driver;
}

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
  asyncHandler(async (req, res) => {
    const scope = await getVehicleScope(req.user!);
    const drivers = await prisma.driver.findMany({
      where: scope ? { ownerId: scope.ownerId } : undefined,
      include: { owner: { select: { id: true, name: true } } },
      orderBy: { createdAt: "asc" },
    });
    res.json(drivers);
  })
);

// POST /api/drivers
router.post(
  "/",
  requireRole("ADMIN", "OPERATOR"),
  validateBody(driverCreateSchema),
  asyncHandler(async (req, res) => {
    const driver = await prisma.driver.create({
      data: { ...req.body, ownerId: req.user!.id },
    });
    res.status(201).json(driver);
  })
);

// PATCH /api/drivers/:id
router.patch(
  "/:id",
  requireRole("ADMIN", "OPERATOR"),
  validateBody(driverUpdateSchema),
  asyncHandler(async (req, res) => {
    const id = Number(req.params.id);
    if (!Number.isInteger(id)) throw badRequest("Identificador de conductor invalido");

    const existing = await getDriverInScope(id, req);

    const driver = await prisma.driver.update({ where: { id }, data: req.body });

    // Si este conductor tiene una cuenta de acceso vinculada (rol DRIVER),
    // el nombre debe mantenerse igual en ambos lados para evitar que el
    // panel admin y la app del conductor muestren identidades distintas.
    if (req.body.name) {
      await prisma.user.updateMany({
        where: { driverId: driver.id },
        data: { name: req.body.name },
      });
    }

    res.json(driver);
  })
);

// DELETE /api/drivers/:id
router.delete(
  "/:id",
  requireRole("ADMIN", "OPERATOR"),
  asyncHandler(async (req, res) => {
    const id = Number(req.params.id);
    if (!Number.isInteger(id)) throw badRequest("Identificador de conductor invalido");

    await getDriverInScope(id, req);
    await prisma.driver.delete({ where: { id } });
    res.status(204).send();
  })
);

export default router;
