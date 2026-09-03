import { Router } from "express";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { Role } from "@prisma/client";
import { prisma } from "../../lib/prisma";
import { validateBody } from "../../utils/validate";
import { asyncHandler } from "../../utils/asyncHandler";
import { requireAuth, requireRole } from "../../middleware/auth";
import { badRequest, notFound } from "../../utils/httpError";

const router = Router();

// RF18 - Gestion de usuarios: solo ADMIN puede administrar usuarios.
router.use(requireAuth, requireRole("ADMIN"));

const selectFields = {
  id: true,
  name: true,
  email: true,
  role: true,
  viewScopeOwnerId: true,
  createdAt: true,
  updatedAt: true,
};

const createUserSchema = z.object({
  name: z.string().min(1, "El nombre es requerido"),
  email: z.string().email("Correo invalido"),
  password: z.string().min(6, "La contrasena debe tener al menos 6 caracteres"),
  role: z.nativeEnum(Role).optional(),
  // Solo aplica cuando role = VIEWER: el operador cuya flota puede observar.
  viewScopeOwnerId: z.number().int().nullable().optional(),
});

const updateUserSchema = z.object({
  name: z.string().min(1).optional(),
  email: z.string().email().optional(),
  password: z.string().min(6).optional(),
  role: z.nativeEnum(Role).optional(),
  viewScopeOwnerId: z.number().int().nullable().optional(),
});

// GET /api/users
router.get(
  "/",
  asyncHandler(async (_req, res) => {
    const users = await prisma.user.findMany({
      select: selectFields,
      orderBy: { createdAt: "asc" },
    });
    res.json(users);
  })
);

async function assertValidViewScopeOwner(viewScopeOwnerId: number | null | undefined) {
  if (viewScopeOwnerId == null) return;
  const owner = await prisma.user.findUnique({ where: { id: viewScopeOwnerId } });
  if (!owner || owner.role !== Role.OPERATOR) {
    throw badRequest("El operador asociado no es valido");
  }
}

// POST /api/users
router.post(
  "/",
  validateBody(createUserSchema),
  asyncHandler(async (req, res) => {
    const { name, email, password, role, viewScopeOwnerId } = req.body as z.infer<typeof createUserSchema>;
    await assertValidViewScopeOwner(viewScopeOwnerId);
    const passwordHash = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: {
        name,
        email,
        passwordHash,
        role: role ?? Role.VIEWER,
        viewScopeOwnerId: role === Role.VIEWER ? viewScopeOwnerId ?? null : null,
      },
      select: selectFields,
    });
    res.status(201).json(user);
  })
);

// PATCH /api/users/:id
router.patch(
  "/:id",
  validateBody(updateUserSchema),
  asyncHandler(async (req, res) => {
    const id = Number(req.params.id);
    if (!Number.isInteger(id)) throw badRequest("Identificador de usuario invalido");
    const { password, ...rest } = req.body as z.infer<typeof updateUserSchema>;

    const existing = await prisma.user.findUnique({ where: { id } });
    if (!existing) {
      throw notFound("Usuario no encontrado");
    }

    const nextRole = rest.role ?? existing.role;
    if (nextRole === Role.VIEWER) {
      await assertValidViewScopeOwner(rest.viewScopeOwnerId);
    } else {
      // Un rol distinto a VIEWER no conserva una asociacion de flota.
      rest.viewScopeOwnerId = null;
    }

    const data: Record<string, unknown> = { ...rest };
    if (password) {
      data.passwordHash = await bcrypt.hash(password, 10);
    }

    const user = await prisma.user.update({
      where: { id },
      data,
      select: selectFields,
    });

    // Si esta cuenta esta vinculada a un conductor, el nombre debe
    // mantenerse igual en ambos lados (ver tambien drivers.routes.ts, que
    // hace la sincronizacion en sentido contrario).
    if (rest.name && existing.driverId) {
      await prisma.driver.update({ where: { id: existing.driverId }, data: { name: rest.name } });
    }

    res.json(user);
  })
);

// DELETE /api/users/:id
router.delete(
  "/:id",
  asyncHandler(async (req, res) => {
    const id = Number(req.params.id);
    if (!Number.isInteger(id)) throw badRequest("Identificador de usuario invalido");
    const existing = await prisma.user.findUnique({
      where: { id },
      include: { _count: { select: { ownedVehicles: true, ownedDrivers: true } } },
    });
    if (!existing) {
      throw notFound("Usuario no encontrado");
    }
    if (existing._count.ownedVehicles > 0 || existing._count.ownedDrivers > 0) {
      throw badRequest(
        "No se puede eliminar: este operador tiene vehiculos o conductores asignados. Reasignalos a otro operador primero."
      );
    }
    await prisma.user.delete({ where: { id } });
    res.status(204).send();
  })
);

export default router;
