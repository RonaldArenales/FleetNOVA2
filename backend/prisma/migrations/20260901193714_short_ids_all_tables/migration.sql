-- Acorta los ids del resto de tablas (Driver ya se hizo en la migracion
-- anterior). Cada tabla pasa de uuid a un entero autoincremental con su
-- propio rango de 6+ digitos, para poder identificar de que tabla es un id
-- con solo mirar el numero:
--   Driver 100000+  User 200000+  Vehicle 300000+  VehicleDriver 400000+
--   MaintenanceSchedule 500000+  MaintenanceRecord 600000+  FuelLog 700000+
--   Alert 800000+  GpsReading 900000+  ObdReading 1000000+
--
-- Como cambia el tipo de las llaves primarias/foraneas, se limpian los
-- datos dependientes y se reconstruyen corriendo `npm run seed` (y dejando
-- correr el simulador) despues de aplicar esta migracion.

-- ============ Quita las llaves foraneas que apuntan a Vehicle.id ============
ALTER TABLE "VehicleDriver" DROP CONSTRAINT "VehicleDriver_vehicleId_fkey";
ALTER TABLE "GpsReading" DROP CONSTRAINT "GpsReading_vehicleId_fkey";
ALTER TABLE "ObdReading" DROP CONSTRAINT "ObdReading_vehicleId_fkey";
ALTER TABLE "FuelLog" DROP CONSTRAINT "FuelLog_vehicleId_fkey";
ALTER TABLE "MaintenanceSchedule" DROP CONSTRAINT "MaintenanceSchedule_vehicleId_fkey";
ALTER TABLE "MaintenanceRecord" DROP CONSTRAINT "MaintenanceRecord_vehicleId_fkey";
ALTER TABLE "Alert" DROP CONSTRAINT "Alert_vehicleId_fkey";

-- ============ Limpia los datos que dependen de los ids viejos ============
TRUNCATE TABLE "VehicleDriver", "GpsReading", "ObdReading", "FuelLog",
  "MaintenanceSchedule", "MaintenanceRecord", "Alert", "Vehicle", "User";

-- ============ User: entero autoincremental desde 200000 ============
ALTER TABLE "User" DROP CONSTRAINT "User_pkey";
ALTER TABLE "User" DROP COLUMN "id";
ALTER TABLE "User" ADD COLUMN "id" SERIAL PRIMARY KEY;
ALTER SEQUENCE "User_id_seq" RESTART WITH 200000;

-- ============ Vehicle: entero autoincremental desde 300000 ============
ALTER TABLE "Vehicle" DROP CONSTRAINT "Vehicle_pkey";
ALTER TABLE "Vehicle" DROP COLUMN "id";
ALTER TABLE "Vehicle" ADD COLUMN "id" SERIAL PRIMARY KEY;
ALTER SEQUENCE "Vehicle_id_seq" RESTART WITH 300000;

-- ============ VehicleDriver: entero desde 400000, vehicleId a entero ============
ALTER TABLE "VehicleDriver" DROP CONSTRAINT "VehicleDriver_pkey";
ALTER TABLE "VehicleDriver" DROP COLUMN "id";
ALTER TABLE "VehicleDriver" ADD COLUMN "id" SERIAL PRIMARY KEY;
ALTER SEQUENCE "VehicleDriver_id_seq" RESTART WITH 400000;
ALTER TABLE "VehicleDriver" DROP COLUMN "vehicleId";
ALTER TABLE "VehicleDriver" ADD COLUMN "vehicleId" INTEGER NOT NULL;
CREATE INDEX "VehicleDriver_vehicleId_idx" ON "VehicleDriver"("vehicleId");

-- ============ MaintenanceSchedule: entero desde 500000 ============
ALTER TABLE "MaintenanceSchedule" DROP CONSTRAINT "MaintenanceSchedule_pkey";
ALTER TABLE "MaintenanceSchedule" DROP COLUMN "id";
ALTER TABLE "MaintenanceSchedule" ADD COLUMN "id" SERIAL PRIMARY KEY;
ALTER SEQUENCE "MaintenanceSchedule_id_seq" RESTART WITH 500000;
ALTER TABLE "MaintenanceSchedule" DROP COLUMN "vehicleId";
ALTER TABLE "MaintenanceSchedule" ADD COLUMN "vehicleId" INTEGER NOT NULL;
CREATE INDEX "MaintenanceSchedule_vehicleId_idx" ON "MaintenanceSchedule"("vehicleId");

-- ============ MaintenanceRecord: entero desde 600000 ============
ALTER TABLE "MaintenanceRecord" DROP CONSTRAINT "MaintenanceRecord_pkey";
ALTER TABLE "MaintenanceRecord" DROP COLUMN "id";
ALTER TABLE "MaintenanceRecord" ADD COLUMN "id" SERIAL PRIMARY KEY;
ALTER SEQUENCE "MaintenanceRecord_id_seq" RESTART WITH 600000;
ALTER TABLE "MaintenanceRecord" DROP COLUMN "vehicleId";
ALTER TABLE "MaintenanceRecord" ADD COLUMN "vehicleId" INTEGER NOT NULL;
CREATE INDEX "MaintenanceRecord_vehicleId_idx" ON "MaintenanceRecord"("vehicleId");

-- ============ FuelLog: entero desde 700000 ============
ALTER TABLE "FuelLog" DROP CONSTRAINT "FuelLog_pkey";
ALTER TABLE "FuelLog" DROP COLUMN "id";
ALTER TABLE "FuelLog" ADD COLUMN "id" SERIAL PRIMARY KEY;
ALTER SEQUENCE "FuelLog_id_seq" RESTART WITH 700000;
ALTER TABLE "FuelLog" DROP COLUMN "vehicleId";
ALTER TABLE "FuelLog" ADD COLUMN "vehicleId" INTEGER NOT NULL;
CREATE INDEX "FuelLog_vehicleId_timestamp_idx" ON "FuelLog"("vehicleId", "timestamp");

-- ============ Alert: entero desde 800000 ============
ALTER TABLE "Alert" DROP CONSTRAINT "Alert_pkey";
ALTER TABLE "Alert" DROP COLUMN "id";
ALTER TABLE "Alert" ADD COLUMN "id" SERIAL PRIMARY KEY;
ALTER SEQUENCE "Alert_id_seq" RESTART WITH 800000;
ALTER TABLE "Alert" DROP COLUMN "vehicleId";
ALTER TABLE "Alert" ADD COLUMN "vehicleId" INTEGER NOT NULL;
CREATE INDEX "Alert_vehicleId_idx" ON "Alert"("vehicleId");

-- ============ GpsReading: entero desde 900000 ============
ALTER TABLE "GpsReading" DROP CONSTRAINT "GpsReading_pkey";
ALTER TABLE "GpsReading" DROP COLUMN "id";
ALTER TABLE "GpsReading" ADD COLUMN "id" SERIAL PRIMARY KEY;
ALTER SEQUENCE "GpsReading_id_seq" RESTART WITH 900000;
ALTER TABLE "GpsReading" DROP COLUMN "vehicleId";
ALTER TABLE "GpsReading" ADD COLUMN "vehicleId" INTEGER NOT NULL;
CREATE INDEX "GpsReading_vehicleId_timestamp_idx" ON "GpsReading"("vehicleId", "timestamp");

-- ============ ObdReading: entero desde 1000000 ============
ALTER TABLE "ObdReading" DROP CONSTRAINT "ObdReading_pkey";
ALTER TABLE "ObdReading" DROP COLUMN "id";
ALTER TABLE "ObdReading" ADD COLUMN "id" SERIAL PRIMARY KEY;
ALTER SEQUENCE "ObdReading_id_seq" RESTART WITH 1000000;
ALTER TABLE "ObdReading" DROP COLUMN "vehicleId";
ALTER TABLE "ObdReading" ADD COLUMN "vehicleId" INTEGER NOT NULL;
CREATE INDEX "ObdReading_vehicleId_timestamp_idx" ON "ObdReading"("vehicleId", "timestamp");

-- ============ Restaura las llaves foraneas hacia Vehicle.id (entero) ============
ALTER TABLE "VehicleDriver" ADD CONSTRAINT "VehicleDriver_vehicleId_fkey" FOREIGN KEY ("vehicleId") REFERENCES "Vehicle"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "GpsReading" ADD CONSTRAINT "GpsReading_vehicleId_fkey" FOREIGN KEY ("vehicleId") REFERENCES "Vehicle"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "ObdReading" ADD CONSTRAINT "ObdReading_vehicleId_fkey" FOREIGN KEY ("vehicleId") REFERENCES "Vehicle"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "FuelLog" ADD CONSTRAINT "FuelLog_vehicleId_fkey" FOREIGN KEY ("vehicleId") REFERENCES "Vehicle"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "MaintenanceSchedule" ADD CONSTRAINT "MaintenanceSchedule_vehicleId_fkey" FOREIGN KEY ("vehicleId") REFERENCES "Vehicle"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "MaintenanceRecord" ADD CONSTRAINT "MaintenanceRecord_vehicleId_fkey" FOREIGN KEY ("vehicleId") REFERENCES "Vehicle"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Alert" ADD CONSTRAINT "Alert_vehicleId_fkey" FOREIGN KEY ("vehicleId") REFERENCES "Vehicle"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
