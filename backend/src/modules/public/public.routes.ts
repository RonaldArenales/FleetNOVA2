import { Router } from "express";
import { z } from "zod";
import { prisma } from "../../lib/prisma";
import { validateBody } from "../../utils/validate";
import { asyncHandler } from "../../utils/asyncHandler";

const router = Router();

const accessRequestSchema = z.object({
  firstName: z.string().trim().min(1, "El nombre es requerido").max(100),
  lastName: z.string().trim().min(1, "El apellido es requerido").max(100),
  phone: z.string().trim().min(1, "El telefono es requerido").max(30),
  email: z.string().trim().email("Correo invalido").max(200),
});

// POST /api/public/access-requests
// Recibe el formulario "Solicitar acceso" de la pagina principal. No
// requiere autenticacion (es para gente que todavia no tiene cuenta); el
// panel admin las lista y las marca como atendidas en /api/access-requests.
router.post(
  "/access-requests",
  validateBody(accessRequestSchema),
  asyncHandler(async (req, res) => {
    const data = req.body as z.infer<typeof accessRequestSchema>;
    const request = await prisma.accessRequest.create({ data });
    res.status(201).json({ id: request.id });
  })
);

// GET /api/public/demo-vehicle
// Vista publica y de solo lectura de un vehiculo de ejemplo, usada
// unicamente por el mapa de muestra de la pagina principal. No requiere
// autenticacion y no expone datos sensibles (VIN, conductor asignado,
// odometro): solo placa, marca/modelo, posicion y velocidad actuales.
router.get(
  "/demo-vehicle",
  asyncHandler(async (_req, res) => {
    const vehicle = await prisma.vehicle.findFirst({
      where: { status: "ACTIVE" },
      orderBy: { createdAt: "asc" },
    });

    if (!vehicle) {
      res.json(null);
      return;
    }

    const gps = await prisma.gpsReading.findFirst({
      where: { vehicleId: vehicle.id },
      orderBy: { timestamp: "desc" },
    });

    res.json({
      plate: vehicle.plate,
      brand: vehicle.brand,
      model: vehicle.model,
      lat: gps?.lat ?? null,
      lng: gps?.lng ?? null,
      speedKph: gps?.speedKph ?? null,
      updatedAt: gps?.timestamp ?? null,
    });
  })
);

export default router;
