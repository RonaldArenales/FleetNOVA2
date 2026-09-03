-- Mismo modelo de propiedad que Vehicle.ownerId, aplicado a Driver: cada
-- conductor pasa a tener un dueno (el OPERATOR que lo registro). Los
-- conductores existentes se asignan al primer ADMIN.
ALTER TABLE "Driver" ADD COLUMN "ownerId" INTEGER;

UPDATE "Driver"
SET "ownerId" = (SELECT "id" FROM "User" WHERE "role" = 'ADMIN' ORDER BY "id" ASC LIMIT 1)
WHERE "ownerId" IS NULL;

ALTER TABLE "Driver" ALTER COLUMN "ownerId" SET NOT NULL;

ALTER TABLE "Driver"
  ADD CONSTRAINT "Driver_ownerId_fkey"
  FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

CREATE INDEX "Driver_ownerId_idx" ON "Driver"("ownerId");
