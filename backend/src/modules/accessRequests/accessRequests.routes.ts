import { Router } from "express";
import { prisma } from "../../lib/prisma";
import { asyncHandler } from "../../utils/asyncHandler";
import { requireAuth, requireRole } from "../../middleware/auth";
import { badRequest, notFound } from "../../utils/httpError";

const router = Router();

// Las solicitudes de acceso traen datos de contacto de terceros (nombre,
// telefono, correo) que todavia no son usuarios del sistema: se restringen
// a ADMIN, no a todo el personal (OPERATOR/VIEWER), igual que "Usuarios".
router.use(requireAuth, requireRole("ADMIN"));

// GET /api/access-requests
router.get(
  "/",
  asyncHandler(async (_req, res) => {
    const requests = await prisma.accessRequest.findMany({ orderBy: { createdAt: "desc" } });
    res.json(requests);
  })
);

// PATCH /api/access-requests/:id/read
router.patch(
  "/:id/read",
  asyncHandler(async (req, res) => {
    const id = Number(req.params.id);
    if (!Number.isInteger(id)) throw badRequest("Identificador de solicitud invalido");

    const existing = await prisma.accessRequest.findUnique({ where: { id } });
    if (!existing) throw notFound("Solicitud no encontrada");

    const request = await prisma.accessRequest.update({ where: { id }, data: { reviewed: true } });
    res.json(request);
  })
);

export default router;
