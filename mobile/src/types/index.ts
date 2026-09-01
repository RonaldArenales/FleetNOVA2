// Tipos compartidos que reflejan el contrato de /api/auth/* y /api/driver/*.

export type Role = 'ADMIN' | 'OPERATOR' | 'VIEWER' | 'DRIVER';

export interface User {
  id: number;
  name: string;
  email: string;
  role: Role;
}

export interface LoginResponse {
  token: string;
  user: User;
}

export type VehicleStatus = 'ACTIVE' | 'MAINTENANCE' | 'INACTIVE';

export interface Vehicle {
  id: number;
  plate: string;
  brand: string;
  model: string;
  year: number;
  vin?: string | null;
  status: VehicleStatus;
  odometerKm: number;
  tireInstalledKm: number;
  tireLifeKm: number;
}

export interface GpsPoint {
  lat: number;
  lng: number;
  speedKph: number;
  timestamp: string;
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
  vehicleId: number;
  gps: GpsPoint | null;
  obd: ObdData | null;
}

export interface Trip {
  startTime: string;
  endTime: string;
  distanceKm: number;
  avgSpeedKph: number;
  durationMinutes: number;
}

export type MaintenanceScheduleStatus = 'SCHEDULED' | 'DONE' | 'OVERDUE' | 'CANCELLED';

export interface MaintenanceSchedule {
  id: number;
  type: string;
  dueDate?: string | null;
  dueOdometerKm?: number | null;
  description?: string | null;
  status: MaintenanceScheduleStatus;
}

export type AlertLevel = 'INFO' | 'WARNING' | 'CRITICAL';

export interface Alert {
  id: number;
  vehicleId: number;
  level: AlertLevel;
  message: string;
  read: boolean;
  createdAt: string;
}

export interface DriverProfile {
  id: number;
  name: string;
  documentId: string;
  licenseNumber: string;
  phone?: string | null;
}

export interface DriverMeResponse {
  driver: DriverProfile;
  vehicle: Vehicle | null;
}

export interface ApiError {
  error: string;
}
