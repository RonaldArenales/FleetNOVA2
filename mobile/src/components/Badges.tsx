import type { AlertLevel, MaintenanceScheduleStatus, VehicleStatus } from '../types';

const base = 'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium';

function Dot({ cls }: { cls: string }) {
  return <span className={`h-1.5 w-1.5 rounded-full ${cls}`} />;
}

export function VehicleStatusBadge({ status }: { status: VehicleStatus }) {
  const map: Record<VehicleStatus, { label: string; cls: string; dot: string }> = {
    ACTIVE: { label: 'Activo', cls: 'bg-emerald-50 text-emerald-700 border-emerald-200', dot: 'bg-emerald-500' },
    MAINTENANCE: { label: 'En mantenimiento', cls: 'bg-amber-50 text-amber-700 border-amber-200', dot: 'bg-amber-500' },
    INACTIVE: { label: 'Inactivo', cls: 'bg-gray-100 text-gray-600 border-gray-200', dot: 'bg-gray-400' },
  };
  const { label, cls, dot } = map[status];
  return (
    <span className={`${base} ${cls}`}>
      <Dot cls={dot} />
      {label}
    </span>
  );
}

export function AlertLevelBadge({ level }: { level: AlertLevel }) {
  const map: Record<AlertLevel, { label: string; cls: string; dot: string }> = {
    INFO: { label: 'Info', cls: 'bg-blue-50 text-blue-700 border-blue-200', dot: 'bg-blue-500' },
    WARNING: { label: 'Advertencia', cls: 'bg-amber-50 text-amber-700 border-amber-200', dot: 'bg-amber-500' },
    CRITICAL: { label: 'Crítica', cls: 'bg-rose-50 text-rose-700 border-rose-200', dot: 'bg-rose-500' },
  };
  const { label, cls, dot } = map[level];
  return (
    <span className={`${base} ${cls}`}>
      <Dot cls={dot} />
      {label}
    </span>
  );
}

export function MaintenanceStatusBadge({ status }: { status: MaintenanceScheduleStatus }) {
  const map: Record<MaintenanceScheduleStatus, { label: string; cls: string; dot: string }> = {
    SCHEDULED: { label: 'Programado', cls: 'bg-blue-50 text-blue-700 border-blue-200', dot: 'bg-blue-500' },
    DONE: { label: 'Realizado', cls: 'bg-emerald-50 text-emerald-700 border-emerald-200', dot: 'bg-emerald-500' },
    OVERDUE: { label: 'Vencido', cls: 'bg-rose-50 text-rose-700 border-rose-200', dot: 'bg-rose-500' },
    CANCELLED: { label: 'Cancelado', cls: 'bg-gray-100 text-gray-600 border-gray-200', dot: 'bg-gray-400' },
  };
  const { label, cls, dot } = map[status];
  return (
    <span className={`${base} ${cls}`}>
      <Dot cls={dot} />
      {label}
    </span>
  );
}
