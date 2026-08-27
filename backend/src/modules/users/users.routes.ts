import { Router } from "express";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { Role } from "@prisma/client";
import { prisma } from "../../lib/prisma";
import { validateBody } from "../../utils/validate";
import { asyncHandler } from "../../utils/asyncHandler";
import { requireAuth, requireRole } from "../../middleware/auth";
import { notFound } from "../../utils/httpError";

const router = Router();

// RF18 - Gestion de usuarios: solo ADMIN puede administrar usuarios.
router.use(requireAuth, requireRole("ADMIN"));

const selectFields = {
  id: true,
  name: true,
  email: true,
  role: true,
  createdAt: true,
  updatedAt: true,
};

const createUserSchema = z.object({
  name: z.string().min(1, "El nombre es requerido"),
  email: z.string().email("Correo invalido"),
  password: z.string().min(6, "La contrasena debe tener al menos 6 caracteres"),
  role: z.nativeEnum(Role).optional(),
});

const updateUserSchema = z.object({
  name: z.string().min(1).optional(),
  email: z.string().email().optional(),
  password: z.string().min(6).optional(),
  role: z.nativeEnum(Role).optional(),
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

// POST /api/users
router.post(
  "/",
  validateBody(createUserSchema),
  asyncHandler(async (req, res) => {
    const { name, email, password, role } = req.body as z.infer<typeof createUserSchema>;
    const passwordHash = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: { name, email, passwordHash, role: role ?? Role.VIEWER },
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
    const { id } = req.params;
    const { password, ...rest } = req.body as z.infer<typeof updateUserSchema>;

    const existing = await prisma.user.findUnique({ where: { id } });
    if (!existing) {
      throw notFound("Usuario no encontrado");
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
    res.json(user);
  })
);

// DELETE /api/users/:id
router.delete(
  "/:id",
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    const existing = await prisma.user.findUnique({ where: { id } });
    if (!existing) {
      throw notFound("Usuario no encontrado");
    }
    await prisma.user.delete({ where: { id } });
    res.status(204).send();
  })
);

export default router;
