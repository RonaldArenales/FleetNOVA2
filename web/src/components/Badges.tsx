import type { AlertLevel, MaintenanceScheduleStatus, VehicleStatus } from '../types';

const base = 'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium';

function Dot({ cls }: { cls: string }) {
  return <span className={`h-1.5 w-1.5 rounded-full ${cls}`} />;
}

export function VehicleStatusBadge({ status }: { status: VehicleStatus }) {
  const map: Record<VehicleStatus, { label: string; cls: string; dot: string }> = {
    ACTIVE: { label: 'Activo', cls: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20', dot: 'bg-emerald-500' },
    MAINTENANCE: { label: 'En mantenimiento', cls: 'bg-amber-500/10 text-amber-400 border-amber-500/20', dot: 'bg-amber-500' },
    INACTIVE: { label: 'Inactivo', cls: 'bg-ink-500/10 text-ink-400 border-ink-500/20', dot: 'bg-ink-400' },
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
    INFO: { label: 'Info', cls: 'bg-blue-500/10 text-blue-400 border-blue-500/20', dot: 'bg-blue-500' },
    WARNING: { label: 'Advertencia', cls: 'bg-amber-500/10 text-amber-400 border-amber-500/20', dot: 'bg-amber-500' },
    CRITICAL: { label: 'Crítica', cls: 'bg-rose-500/10 text-rose-400 border-rose-500/20', dot: 'bg-rose-500' },
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
    SCHEDULED: { label: 'Programado', cls: 'bg-blue-500/10 text-blue-400 border-blue-500/20', dot: 'bg-blue-500' },
    DONE: { label: 'Realizado', cls: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20', dot: 'bg-emerald-500' },
    OVERDUE: { label: 'Vencido', cls: 'bg-rose-500/10 text-rose-400 border-rose-500/20', dot: 'bg-rose-500' },
    CANCELLED: { label: 'Cancelado', cls: 'bg-ink-500/10 text-ink-400 border-ink-500/20', dot: 'bg-ink-400' },
  };
  const { label, cls, dot } = map[status];
  return (
    <span className={`${base} ${cls}`}>
      <Dot cls={dot} />
      {label}
    </span>
  );
}
