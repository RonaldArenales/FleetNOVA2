-- Cada vehiculo pasa a tener un dueno (el OPERATOR que lo creo). Los
-- vehiculos existentes se asignan al primer ADMIN, ya que fueron creados
-- antes de que este modelo existiera.
ALTER TABLE "Vehicle" ADD COLUMN "ownerId" INTEGER;

UPDATE "Vehicle"
SET "ownerId" = (SELECT "id" FROM "User" WHERE "role" = 'ADMIN' ORDER BY "id" ASC LIMIT 1)
WHERE "ownerId" IS NULL;

ALTER TABLE "Vehicle" ALTER COLUMN "ownerId" SET NOT NULL;

ALTER TABLE "Vehicle"
  ADD CONSTRAINT "Vehicle_ownerId_fkey"
  FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

CREATE INDEX "Vehicle_ownerId_idx" ON "Vehicle"("ownerId");

-- Un usuario VIEWER se asocia a un operador para observar solo su flota.
-- Nula por defecto: un VIEWER sin asociar no ve ningun vehiculo.
ALTER TABLE "User" ADD COLUMN "viewScopeOwnerId" INTEGER;

ALTER TABLE "User"
  ADD CONSTRAINT "User_viewScopeOwnerId_fkey"
  FOREIGN KEY ("viewScopeOwnerId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE INDEX "User_viewScopeOwnerId_idx" ON "User"("viewScopeOwnerId");
