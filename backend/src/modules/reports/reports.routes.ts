import { Router } from "express";
import { Prisma } from "@prisma/client";
import { prisma } from "../../lib/prisma";
import { asyncHandler } from "../../utils/asyncHandler";
import { requireAuth, requireStaff } from "../../middleware/auth";
import { computeTrips } from "../../utils/trips";
import { getVehicleScope } from "../../utils/vehicleScope";

const router = Router();

router.use(requireAuth, requireStaff);

// GET /api/reports/fleet?from=&to=
// Reporte agregado por vehiculo: distancia total (via viajes), combustible
// consumido, cantidad de alertas y eventos de mantenimiento en el rango.
router.get(
  "/fleet",
  asyncHandler(async (req, res) => {
    const from = req.query.from as string | undefined;
    const to = req.query.to as string | undefined;

    const fromDate = from ? new Date(from) : new Date(0);
    // Un "to" de solo fecha (ej. "2026-09-01", como envia el selector de
    // fecha del panel) se interpreta como medianoche UTC de ese dia, lo que
    // dejaria fuera todo lo ocurrido despues de esa hora en el mismo dia.
    // Se ajusta al final del dia para que el rango incluya el dia completo.
    const toDate = to ? new Date(`${to}T23:59:59.999Z`) : new Date();

    const dateFilter: Prisma.DateTimeFilter = { gte: fromDate, lte: toDate };

    const scope = await getVehicleScope(req.user!);
    const vehicles = await prisma.vehicle.findMany({
      where: scope ? { ownerId: scope.ownerId } : undefined,
    });

    const report = await Promise.all(
      vehicles.map(async (vehicle) => {
        const [gpsReadings, fuelLogs, alertsCount, maintenanceRecordsCount] = await Promise.all([
          prisma.gpsReading.findMany({
            where: { vehicleId: vehicle.id, timestamp: dateFilter },
            orderBy: { timestamp: "asc" },
          }),
          prisma.fuelLog.findMany({
            where: { vehicleId: vehicle.id, timestamp: dateFilter },
          }),
          prisma.alert.count({
            where: { vehicleId: vehicle.id, createdAt: dateFilter },
          }),
          prisma.maintenanceRecord.count({
            where: { vehicleId: vehicle.id, performedAt: dateFilter },
          }),
        ]);

        const trips = computeTrips(
          gpsReadings.map((r) => ({
            lat: r.lat,
            lng: r.lng,
            speedKph: r.speedKph,
            timestamp: r.timestamp,
          }))
        );
        const totalDistanceKm = trips.reduce((sum, t) => sum + t.distanceKm, 0);
        const fuelConsumedLiters = fuelLogs.reduce((sum, f) => sum + f.litersAdded, 0);

        return {
          vehicleId: vehicle.id,
          plate: vehicle.plate,
          totalDistanceKm,
          fuelConsumedLiters,
          alertsCount,
          maintenanceEventsCount: maintenanceRecordsCount,
        };
      })
    );

    res.json({ from: fromDate, to: toDate, vehicles: report });
  })
);

export default router;
