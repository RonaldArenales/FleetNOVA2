-- Tabla para las solicitudes de acceso enviadas desde el formulario
-- publico de la pagina principal.
CREATE TABLE "AccessRequest" (
    "id" SERIAL NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "reviewed" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AccessRequest_pkey" PRIMARY KEY ("id")
);

-- Sigue el patron de ids del proyecto: bloque propio de 6+ digitos.
ALTER SEQUENCE "AccessRequest_id_seq" RESTART WITH 1100000;
