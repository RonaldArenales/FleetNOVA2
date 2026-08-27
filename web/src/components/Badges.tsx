import type { AlertLevel, MaintenanceScheduleStatus, VehicleStatus } from '../types';

const base = 'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium';

export function VehicleStatusBadge({ status }: { status: VehicleStatus }) {
  const map: Record<VehicleStatus, { label: string; cls: string }> = {
    ACTIVE: { label: 'Activo', cls: 'bg-green-100 text-green-800' },
    MAINTENANCE: { label: 'En mantenimiento', cls: 'bg-yellow-100 text-yellow-800' },
    INACTIVE: { label: 'Inactivo', cls: 'bg-gray-200 text-gray-700' },
  };
  const { label, cls } = map[status];
  return <span className={`${base} ${cls}`}>{label}</span>;
}

export function AlertLevelBadge({ level }: { level: AlertLevel }) {
  const map: Record<AlertLevel, { label: string; cls: string }> = {
    INFO: { label: 'Info', cls: 'bg-blue-100 text-blue-800' },
    WARNING: { label: 'Advertencia', cls: 'bg-yellow-100 text-yellow-800' },
    CRITICAL: { label: 'Crítica', cls: 'bg-red-100 text-red-800' },
  };
  const { label, cls } = map[level];
  return <span className={`${base} ${cls}`}>{label}</span>;
}

export function MaintenanceStatusBadge({ status }: { status: MaintenanceScheduleStatus }) {
  const map: Record<MaintenanceScheduleStatus, { label: string; cls: string }> = {
    SCHEDULED: { label: 'Programado', cls: 'bg-blue-100 text-blue-800' },
    DONE: { label: 'Realizado', cls: 'bg-green-100 text-green-800' },
    OVERDUE: { label: 'Vencido', cls: 'bg-red-100 text-red-800' },
    CANCELLED: { label: 'Cancelado', cls: 'bg-gray-200 text-gray-700' },
  };
  const { label, cls } = map[status];
  return <span className={`${base} ${cls}`}>{label}</span>;
}
