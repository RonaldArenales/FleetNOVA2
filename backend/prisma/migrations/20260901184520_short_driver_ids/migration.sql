-- Cambia Driver.id de uuid a un entero corto (codigo de 6 digitos, arranca
-- en 100000). Como es un cambio de tipo de la llave primaria, se limpian
-- los datos dependientes (VehicleDriver, User.driverId) y se reconstruyen
-- corriendo `npm run seed` despues de aplicar esta migracion.

-- Quita las llaves foraneas que apuntan a Driver.id
ALTER TABLE "User" DROP CONSTRAINT "User_driverId_fkey";
ALTER TABLE "VehicleDriver" DROP CONSTRAINT "VehicleDriver_driverId_fkey";

-- Limpia los datos que dependen del id viejo (se recrean con el seed)
UPDATE "User" SET "driverId" = NULL;
DELETE FROM "VehicleDriver";
DELETE FROM "Driver";

-- Reemplaza el id de Driver por un entero autoincremental de 6 digitos
ALTER TABLE "Driver" DROP CONSTRAINT "Driver_pkey";
ALTER TABLE "Driver" DROP COLUMN "id";
ALTER TABLE "Driver" ADD COLUMN "id" SERIAL PRIMARY KEY;
ALTER SEQUENCE "Driver_id_seq" RESTART WITH 100000;

-- Ajusta las columnas que referencian a Driver.id al nuevo tipo entero
ALTER TABLE "User" DROP COLUMN "driverId";
ALTER TABLE "User" ADD COLUMN "driverId" INTEGER;
ALTER TABLE "User" ADD CONSTRAINT "User_driverId_key" UNIQUE ("driverId");

ALTER TABLE "VehicleDriver" DROP COLUMN "driverId";
ALTER TABLE "VehicleDriver" ADD COLUMN "driverId" INTEGER NOT NULL;
CREATE INDEX "VehicleDriver_driverId_idx" ON "VehicleDriver"("driverId");

-- Restaura las llaves foraneas
ALTER TABLE "User" ADD CONSTRAINT "User_driverId_fkey" FOREIGN KEY ("driverId") REFERENCES "Driver"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "VehicleDriver" ADD CONSTRAINT "VehicleDriver_driverId_fkey" FOREIGN KEY ("driverId") REFERENCES "Driver"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
