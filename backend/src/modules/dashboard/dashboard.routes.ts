import { Router } from "express";
import { VehicleStatus, MaintenanceStatus } from "@prisma/client";
import { prisma } from "../../lib/prisma";
import { asyncHandler } from "../../utils/asyncHandler";
import { requireAuth, requireStaff } from "../../middleware/auth";
import { getVehicleScope } from "../../utils/vehicleScope";

const router = Router();

router.use(requireAuth, requireStaff);

// GET /api/dashboard/summary
router.get(
  "/summary",
  asyncHandler(async (req, res) => {
    const now = new Date();
    const in7Days = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    const scope = await getVehicleScope(req.user!);
    const vehicleWhere = scope ? { ownerId: scope.ownerId } : undefined;

    const [totalVehicles, activeVehicles, unreadAlerts, scheduledMaintenances, vehicles, pendingAccessRequests] =
      await Promise.all([
        prisma.vehicle.count({ where: vehicleWhere }),
        prisma.vehicle.count({ where: { ...vehicleWhere, status: VehicleStatus.ACTIVE } }),
        prisma.alert.count({ where: { read: false, vehicle: vehicleWhere } }),
        prisma.maintenanceSchedule.findMany({
          where: { status: MaintenanceStatus.SCHEDULED, vehicle: vehicleWhere },
          include: { vehicle: true },
        }),
        prisma.vehicle.findMany({ where: vehicleWhere }),
        scope ? Promise.resolve(0) : prisma.accessRequest.count({ where: { reviewed: false } }),
      ]);

    // Vencidos o por vencer: fecha limite dentro de 7 dias, o kilometraje
    // objetivo a menos de 500km del odometro actual del vehiculo.
    const maintenancesDue = scheduledMaintenances.filter((m) => {
      const dueByDate = m.dueDate ? m.dueDate <= in7Days : false;
      const dueByOdometer =
        m.dueOdometerKm != null && m.vehicle.odometerKm >= m.dueOdometerKm - 500;
      return dueByDate || dueByOdometer;
    }).length;

    // Consumo promedio de la flota: mejor esfuerzo usando los ultimos 2
    // registros de combustible de cada vehiculo.
    let consumptionSamples: number[] = [];
    for (const vehicle of vehicles) {
      const logs = await prisma.fuelLog.findMany({
        where: { vehicleId: vehicle.id },
        orderBy: { timestamp: "desc" },
        take: 2,
      });
      if (logs.length < 2) continue;
      const [latest, previous] = logs;
      const distanceKm = latest.odometerAtFill - previous.odometerAtFill;
      if (distanceKm <= 0 || latest.litersAdded <= 0) continue;
      consumptionSamples.push((latest.litersAdded / distanceKm) * 100);
    }
    const avgFuelConsumptionLper100km =
      consumptionSamples.length > 0
        ? consumptionSamples.reduce((sum, v) => sum + v, 0) / consumptionSamples.length
        : null;

    res.json({
      totalVehicles,
      activeVehicles,
      unreadAlerts,
      maintenancesDue,
      avgFuelConsumptionLper100km,
      pendingAccessRequests,
    });
  })
);

export default router;
