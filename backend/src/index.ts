import "dotenv/config";
import express from "express";
import cors from "cors";

import authRoutes from "./modules/auth/auth.routes";
import usersRoutes from "./modules/users/users.routes";
import vehiclesRoutes from "./modules/vehicles/vehicles.routes";
import driversRoutes from "./modules/drivers/drivers.routes";
import driverPortalRoutes from "./modules/driver/driver.routes";
import telemetryRoutes from "./modules/telemetry/telemetry.routes";
import fuelRoutes from "./modules/fuel/fuel.routes";
import { vehicleMaintenanceRouter, maintenanceSchedulesRouter } from "./modules/maintenance/maintenance.routes";
import alertsRoutes from "./modules/alerts/alerts.routes";
import dashboardRoutes from "./modules/dashboard/dashboard.routes";
import reportsRoutes from "./modules/reports/reports.routes";
import publicRoutes from "./modules/public/public.routes";
import accessRequestsRoutes from "./modules/accessRequests/accessRequests.routes";
import { errorHandler, notFoundHandler } from "./middleware/errorHandler";

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 4000;

const allowedOrigins = (process.env.CORS_ORIGIN ?? "http://localhost:5173,http://localhost:5174")
  .split(",")
  .map((origin) => origin.trim());

app.use(
  cors({
    origin: allowedOrigins,
  })
);
app.use(express.json());

// Health check (sin autenticacion).
app.get("/api/health", (_req, res) => {
  res.json({ status: "ok" });
});

app.use("/api/public", publicRoutes);

app.use("/api/auth", authRoutes);
app.use("/api/users", usersRoutes);
app.use("/api/vehicles", vehiclesRoutes);
// fuel-logs / fuel-consumption / maintenance-schedules / maintenance-records
// hang off /api/vehicles/:id/..., mounted separately with mergeParams.
app.use("/api/vehicles/:id", fuelRoutes);
app.use("/api/vehicles/:id", vehicleMaintenanceRouter);
app.use("/api/maintenance-schedules", maintenanceSchedulesRouter);
app.use("/api/drivers", driversRoutes);
app.use("/api/driver", driverPortalRoutes);
app.use("/api/telemetry", telemetryRoutes);
app.use("/api/alerts", alertsRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/reports", reportsRoutes);
app.use("/api/access-requests", accessRequestsRoutes);

app.use(notFoundHandler);
app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`FleetNova backend listening on port ${PORT}`);
});
