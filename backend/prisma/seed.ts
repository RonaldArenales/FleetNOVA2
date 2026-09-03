import "dotenv/config";
import { PrismaClient, Role, VehicleStatus, MaintenanceStatus } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  // --- Usuario administrador -------------------------------------------
  const adminPassword = "admin1234";
  const passwordHash = await bcrypt.hash(adminPassword, 10);
  const admin = await prisma.user.upsert({
    where: { email: "admin@fleetnova.com" },
    update: {},
    create: {
      name: "Administrador FleetNova",
      email: "admin@fleetnova.com",
      passwordHash,
      role: Role.ADMIN,
    },
  });

  // --- Vehiculos de carga pesada -----------------------------------------
  const vehiclesData = [
    {
      plate: "WBA123",
      brand: "Kenworth",
      model: "T680",
      year: 2019,
      vin: "1XKAD49X8KJ123456",
      status: VehicleStatus.ACTIVE,
      odometerKm: 182340,
      tireInstalledKm: 150000,
      tireLifeKm: 80000,
    },
    {
      plate: "WBB456",
      brand: "International",
      model: "LT625",
      year: 2021,
      vin: "3HSDJAPR5MN654321",
      status: VehicleStatus.ACTIVE,
      odometerKm: 96500,
      tireInstalledKm: 70000,
      tireLifeKm: 80000,
    },
    {
      plate: "WBC789",
      brand: "Freightliner",
      model: "Cascadia",
      year: 2020,
      vin: "1FUJGLDR0LLJK7890",
      status: VehicleStatus.MAINTENANCE,
      odometerKm: 143200,
      tireInstalledKm: 120000,
      tireLifeKm: 80000,
    },
    {
      plate: "WBD012",
      brand: "Volvo",
      model: "VNL 860",
      year: 2022,
      vin: "4V4NC9EH2NN012345",
      status: VehicleStatus.ACTIVE,
      odometerKm: 54800,
      tireInstalledKm: 20000,
      tireLifeKm: 90000,
    },
    {
      plate: "WBE345",
      brand: "Mack",
      model: "Anthem",
      year: 2018,
      vin: "1M2AX18C0JM345678",
      status: VehicleStatus.INACTIVE,
      odometerKm: 268900,
      tireInstalledKm: 250000,
      tireLifeKm: 75000,
    },
  ];

  const vehicles = [];
  for (const v of vehiclesData) {
    const vehicle = await prisma.vehicle.upsert({
      where: { plate: v.plate },
      update: {},
      create: { ...v, ownerId: admin.id },
    });
    vehicles.push(vehicle);
  }

  // --- Conductores -------------------------------------------------------
  const driversData = [
    {
      name: "Carlos Andres Ramirez",
      documentId: "1098234567",
      licenseNumber: "LIC-C2-88213",
      phone: "3101234567",
    },
    {
      name: "Luz Marina Gomez",
      documentId: "1102345678",
      licenseNumber: "LIC-C2-77102",
      phone: "3112345678",
    },
    {
      name: "Jorge Eliecer Suarez",
      documentId: "1093456789",
      licenseNumber: "LIC-C3-65344",
      phone: "3123456789",
    },
    {
      name: "Diana Patricia Cardenas",
      documentId: "1085567890",
      licenseNumber: "LIC-C2-91820",
      phone: "3134567890",
    },
    {
      name: "Wilmer Alexander Pena",
      documentId: "1116678901",
      licenseNumber: "LIC-C3-40521",
      phone: "3145678901",
    },
  ];

  const drivers = [];
  for (const d of driversData) {
    const driver = await prisma.driver.upsert({
      where: { documentId: d.documentId },
      update: {},
      create: { ...d, ownerId: admin.id },
    });
    drivers.push(driver);
  }

  // --- Cuentas de acceso para conductores (rol DRIVER) --------------------
  const driverPassword = "conductor123";
  const driverPasswordHash = await bcrypt.hash(driverPassword, 10);
  const slugify = (name: string) =>
    name
      .normalize("NFD")
      .replace(/\p{Diacritic}/gu, "")
      .toLowerCase()
      .trim()
      .replace(/\s+/g, ".");

  for (const driver of drivers) {
    const email = `${slugify(driver.name)}@fleetnova.com`;
    await prisma.user.upsert({
      where: { email },
      update: { driverId: driver.id },
      create: {
        name: driver.name,
        email,
        passwordHash: driverPasswordHash,
        role: Role.DRIVER,
        driverId: driver.id,
      },
    });
  }

  // --- Asignaciones vehiculo-conductor ------------------------------------
  for (let i = 0; i < vehicles.length; i++) {
    const vehicle = vehicles[i];
    const driver = drivers[i];
    const existing = await prisma.vehicleDriver.findFirst({
      where: { vehicleId: vehicle.id, driverId: driver.id },
    });
    if (!existing) {
      await prisma.vehicleDriver.create({
        data: { vehicleId: vehicle.id, driverId: driver.id, active: true },
      });
    }
  }

  // --- Mantenimiento: un par de programaciones y un registro por vehiculo -
  for (const vehicle of vehicles) {
    const scheduleCount = await prisma.maintenanceSchedule.count({
      where: { vehicleId: vehicle.id },
    });
    if (scheduleCount === 0) {
      await prisma.maintenanceSchedule.create({
        data: {
          vehicleId: vehicle.id,
          type: "Cambio de aceite",
          dueDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
          description: "Cambio de aceite y filtro de motor",
          status: MaintenanceStatus.SCHEDULED,
        },
      });
      await prisma.maintenanceSchedule.create({
        data: {
          vehicleId: vehicle.id,
          type: "Revision de frenos",
          dueOdometerKm: vehicle.odometerKm + 3000,
          description: "Inspeccion y ajuste de sistema de frenos",
          status: MaintenanceStatus.SCHEDULED,
        },
      });
    }

    const recordCount = await prisma.maintenanceRecord.count({
      where: { vehicleId: vehicle.id },
    });
    if (recordCount === 0) {
      await prisma.maintenanceRecord.create({
        data: {
          vehicleId: vehicle.id,
          type: "Mantenimiento preventivo",
          description: "Revision general de 20,000 km",
          cost: 450000,
          odometerKm: Math.max(0, vehicle.odometerKm - 5000),
        },
      });
    }
  }

  console.log("Seed completado.");
  console.log("---------------------------------------------");
  console.log("Credenciales de administrador:");
  console.log(`  email:    ${admin.email}`);
  console.log(`  password: ${adminPassword}`);
  console.log("---------------------------------------------");
  console.log(`Vehiculos creados/actualizados: ${vehicles.length}`);
  console.log(`Conductores creados/actualizados: ${drivers.length}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
