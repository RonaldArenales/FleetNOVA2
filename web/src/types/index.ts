// Tipos compartidos que reflejan el contrato de la API del backend.

export type Role = 'ADMIN' | 'OPERATOR' | 'VIEWER';

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  createdAt?: string;
}

export interface LoginResponse {
  token: string;
  user: User;
}

export type VehicleStatus = 'ACTIVE' | 'MAINTENANCE' | 'INACTIVE';

export interface Vehicle {
  id: string;
  plate: string;
  brand: string;
  model: string;
  year: number;
  vin?: string | null;
  status: VehicleStatus;
  odometerKm: number;
  tireInstalledKm: number;
  tireLifeKm: number;
  createdAt: string;
  updatedAt: string;
}

export interface GpsPoint {
  lat: number;
  lng: number;
  speedKph: number;
  timestamp: string;
}

export interface GpsHistoryPoint extends GpsPoint {
  id: string;
}

export interface ObdData {
  rpm: number;
  engineTempC: number;
  batteryVoltage: number;
  transmissionOk: boolean;
  engineOn: boolean;
  odometerKm: number;
  faultCodes: string[];
  timestamp: string;
}

export interface VehicleStatusResponse {
  vehicleId: string;
  gps: GpsPoint | null;
  obd: ObdData | null;
}

export interface TireWear {
  kmSinceInstalled: number;
  tireLifeKm: number;
  wearPercent: number;
  remainingKm: number;
}

export interface Trip {
  startTime: string;
  endTime: string;
  distanceKm: number;
  avgSpeedKph: number;
  durationMinutes: number;
}

export interface Driver {
  id: string;
  name: string;
  documentId: string;
  licenseNumber: string;
  phone?: string | null;
  createdAt: string;
}

export interface FuelLog {
  id: string;
  litersAdded: number;
  cost?: number | null;
  odometerAtFill: number;
  timestamp: string;
}

export type FuelConsumption = { litersPer100km: number } | { message: string };

export type MaintenanceScheduleStatus = 'SCHEDULED' | 'DONE' | 'OVERDUE' | 'CANCELLED';

export interface MaintenanceSchedule {
  id: string;
  type: string;
  dueDate?: string | null;
  dueOdometerKm?: number | null;
  description?: string | null;
  status: MaintenanceScheduleStatus;
}

export interface MaintenanceRecord {
  id: string;
  type: string;
  description?: string | null;
  cost?: number | null;
  odometerKm: number;
  performedAt: string;
}

export type AlertLevel = 'INFO' | 'WARNING' | 'CRITICAL';

export interface Alert {
  id: string;
  vehicleId: string;
  level: AlertLevel;
  message: string;
  read: boolean;
  createdAt: string;
}

export interface DashboardSummary {
  totalVehicles: number;
  activeVehicles: number;
  unreadAlerts: number;
  maintenancesDue: number;
  avgFuelConsumptionLper100km: number | null;
}

export interface FleetReportVehicle {
  vehicleId: string;
  plate: string;
  totalDistanceKm: number;
  fuelConsumedLiters: number;
  alertsCount: number;
  maintenanceEventsCount: number;
}

export interface FleetReport {
  from: string;
  to: string;
  vehicles: FleetReportVehicle[];
}

export interface ApiError {
  error: string;
}
