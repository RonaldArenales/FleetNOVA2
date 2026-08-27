import { Router } from "express";
import { Prisma } from "@prisma/client";
import { prisma } from "../../lib/prisma";
import { asyncHandler } from "../../utils/asyncHandler";
import { requireAuth } from "../../middleware/auth";
import { computeTrips } from "../../utils/trips";

const router = Router();

router.use(requireAuth);

// GET /api/reports/fleet?from=&to=
// Reporte agregado por vehiculo: distancia total (via viajes), combustible
// consumido, cantidad de alertas y eventos de mantenimiento en el rango.
router.get(
  "/fleet",
  asyncHandler(async (req, res) => {
    const from = req.query.from as string | undefined;
    const to = req.query.to as string | undefined;

    const fromDate = from ? new Date(from) : new Date(0);
    const toDate = to ? new Date(to) : new Date();

    const dateFilter: Prisma.DateTimeFilter = { gte: fromDate, lte: toDate };

    const vehicles = await prisma.vehicle.findMany();

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
