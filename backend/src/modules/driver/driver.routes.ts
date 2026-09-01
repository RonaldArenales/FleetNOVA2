import { Router } from "express";
import { prisma } from "../../lib/prisma";
import { asyncHandler } from "../../utils/asyncHandler";
import { requireAuth, requireRole } from "../../middleware/auth";
import { notFound } from "../../utils/httpError";
import { computeTrips } from "../../utils/trips";

const router = Router();

// Todas las rutas de este modulo son exclusivas del actor Conductor:
// un usuario con Role.DRIVER solo puede consultar el vehiculo que tiene
// asignado actualmente, nunca el resto de la flota.
router.use(requireAuth, requireRole("DRIVER"));

async function getAssignedVehicleId(userId: number) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user?.driverId) throw notFound("Esta cuenta no esta asociada a un conductor");

  const assignment = await prisma.vehicleDriver.findFirst({
    where: { driverId: user.driverId, active: true },
    orderBy: { assignedAt: "desc" },
  });
  if (!assignment) throw notFound("No tienes un vehiculo asignado actualmente");

  return { driverId: user.driverId, vehicleId: assignment.vehicleId };
}

// GET /api/driver/me - perfil del conductor y su vehiculo asignado
router.get(
  "/me",
  asyncHandler(async (req, res) => {
    const user = await prisma.user.findUnique({ where: { id: req.user!.id } });
    if (!user?.driverId) throw notFound("Esta cuenta no esta asociada a un conductor");

    const [driver, assignment] = await Promise.all([
      prisma.driver.findUnique({ where: { id: user.driverId } }),
      prisma.vehicleDriver.findFirst({
        where: { driverId: user.driverId, active: true },
        orderBy: { assignedAt: "desc" },
        include: { vehicle: true },
      }),
    ]);
    if (!driver) throw notFound("Conductor no encontrado");

    res.json({
      driver: {
        id: driver.id,
        // El nombre visible es el de la cuenta de acceso (user.name), no el
        // del registro interno de conductor: son la misma persona y deben
        // coincidir siempre con lo que ve el panel admin en "Usuarios".
        name: user.name,
        documentId: driver.documentId,
        licenseNumber: driver.licenseNumber,
        phone: driver.phone,
      },
      vehicle: assignment?.vehicle ?? null,
    });
  })
);

// GET /api/driver/vehicle/status - estado GPS + OBD-II del vehiculo asignado
router.get(
  "/vehicle/status",
  asyncHandler(async (req, res) => {
    const { vehicleId } = await getAssignedVehicleId(req.user!.id);

    const [gps, obd] = await Promise.all([
      prisma.gpsReading.findFirst({ where: { vehicleId }, orderBy: { timestamp: "desc" } }),
      prisma.obdReading.findFirst({ where: { vehicleId }, orderBy: { timestamp: "desc" } }),
    ]);

    res.json({ vehicleId, gps: gps ?? null, obd: obd ?? null });
  })
);

// GET /api/driver/vehicle/maintenance-schedules - mantenimientos programados
router.get(
  "/vehicle/maintenance-schedules",
  asyncHandler(async (req, res) => {
    const { vehicleId } = await getAssignedVehicleId(req.user!.id);
    const schedules = await prisma.maintenanceSchedule.findMany({
      where: { vehicleId },
      orderBy: { createdAt: "desc" },
    });
    res.json(schedules);
  })
);

// GET /api/driver/vehicle/trips - historial de recorridos
router.get(
  "/vehicle/trips",
  asyncHandler(async (req, res) => {
    const { vehicleId } = await getAssignedVehicleId(req.user!.id);
    const readings = await prisma.gpsReading.findMany({
      where: { vehicleId },
      orderBy: { timestamp: "asc" },
    });
    const trips = computeTrips(
      readings.map((r) => ({ lat: r.lat, lng: r.lng, speedKph: r.speedKph, timestamp: r.timestamp }))
    );
    res.json(trips);
  })
);

// GET /api/driver/alerts - alertas del vehiculo asignado
router.get(
  "/alerts",
  asyncHandler(async (req, res) => {
    const { vehicleId } = await getAssignedVehicleId(req.user!.id);
    const alerts = await prisma.alert.findMany({
      where: { vehicleId },
      orderBy: { createdAt: "desc" },
    });
    res.json(alerts);
  })
);

export default router;
