import type { ReactNode } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { api } from '../lib/api';
import type { Alert, DashboardSummary } from '../types';
import { LoadingState, ErrorState } from '../components/QueryState';
import { AlertLevelBadge } from '../components/Badges';

function formatDateTime(value: string) {
  try {
    return new Date(value).toLocaleString('es', { dateStyle: 'short', timeStyle: 'short' });
  } catch {
    return value;
  }
}

function IconTruck() {
  return (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 01-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 00-3.213-9.193 2.056 2.056 0 00-1.58-.86H14.25M16.5 18.75h-2.25m0-11.25h5.25M3 12h12.75" />
    </svg>
  );
}

function IconGrid() {
  return (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z" />
    </svg>
  );
}

function IconBell() {
  return (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" />
    </svg>
  );
}

function IconWrench() {
  return (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M11.42 15.17L17.25 21A2.652 2.652 0 0021 17.25l-5.877-5.877M11.42 15.17l2.496-3.03c.317-.384.74-.626 1.208-.766M11.42 15.17l-4.655 5.653a2.548 2.548 0 11-3.586-3.586l6.837-5.63m5.108-.233c.55-.164 1.163-.188 1.743-.14a4.5 4.5 0 004.486-6.336l-3.276 3.277a3.004 3.004 0 01-2.25-2.25l3.276-3.276a4.5 4.5 0 00-6.336 4.486c.091 1.076-.071 2.264-.904 2.95l-.102.085m-1.745 1.437L5.909 7.5H4.5L2.25 3.75l1.5-1.5L7.5 4.5v1.409l4.26 4.26" />
    </svg>
  );
}

function IconFuel() {
  return (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3v11.25A2.25 2.25 0 006 16.5h2.25M3.75 3h-1.5m1.5 0h16.5m0 0h1.5m-1.5 0v5.25A2.25 2.25 0 0118 10.5h-1.5m-9 6h6m-6 0V19.5a1.5 1.5 0 001.5 1.5h3a1.5 1.5 0 001.5-1.5v-2.25m-6 0V13.5m6 3v-3m0-6h1.5a2.25 2.25 0 012.25 2.25v3.75a1.5 1.5 0 01-3 0V9" />
    </svg>
  );
}

const statAccents = {
  indigo: 'border-indigo-100 bg-indigo-50 text-indigo-600',
  green: 'border-emerald-100 bg-emerald-50 text-emerald-600',
  amber: 'border-amber-100 bg-amber-50 text-amber-600',
  red: 'border-rose-100 bg-rose-50 text-rose-600',
  cyan: 'border-cyan-100 bg-cyan-50 text-cyan-600',
} as const;

function StatCard({
  label,
  value,
  icon,
  accent,
}: {
  label: string;
  value: string | number;
  icon: ReactNode;
  accent: keyof typeof statAccents;
}) {
  return (
    <div className="card flex items-center gap-4 p-5">
      <div className={`flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full border-2 ${statAccents[accent]}`}>
        {icon}
      </div>
      <div className="min-w-0">
        <p className="text-sm font-medium text-gray-500">{label}</p>
        <p className="mt-0.5 text-2xl font-bold leading-tight text-gray-900">{value}</p>
      </div>
    </div>
  );
}

export function Dashboard() {
  const summaryQuery = useQuery({
    queryKey: ['dashboard-summary'],
    queryFn: async () => {
      const { data } = await api.get<DashboardSummary>('/dashboard/summary');
      return data;
    },
  });

  const alertsQuery = useQuery({
    queryKey: ['alerts', { unread: true }],
    queryFn: async () => {
      const { data } = await api.get<Alert[]>('/alerts', { params: { unread: true } });
      return data;
    },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="icon-badge">
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75"
            />
          </svg>
        </div>
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900">Dashboard</h1>
          <p className="text-sm text-gray-500">Resumen general de la flota</p>
        </div>
      </div>

      {summaryQuery.isLoading && <LoadingState label="Cargando resumen..." />}
      {summaryQuery.isError && <ErrorState error={summaryQuery.error} retry={() => summaryQuery.refetch()} />}
      {summaryQuery.data && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
          <StatCard label="Vehículos activos" value={summaryQuery.data.activeVehicles} icon={<IconTruck />} accent="indigo" />
          <StatCard label="Total de vehículos" value={summaryQuery.data.totalVehicles} icon={<IconGrid />} accent="cyan" />
          <StatCard label="Alertas sin leer" value={summaryQuery.data.unreadAlerts} icon={<IconBell />} accent="red" />
          <StatCard label="Mantenimientos próximos" value={summaryQuery.data.maintenancesDue} icon={<IconWrench />} accent="amber" />
          <StatCard
            label="Consumo promedio (L/100km)"
            value={
              summaryQuery.data.avgFuelConsumptionLper100km != null
                ? summaryQuery.data.avgFuelConsumptionLper100km.toFixed(1)
                : 'Sin datos'
            }
            icon={<IconFuel />}
            accent="green"
          />
        </div>
      )}

      <div className="card p-5">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-800">Alertas recientes sin leer</h2>
          <Link to="/alertas" className="link-action text-sm">
            Ver todas
          </Link>
        </div>

        {alertsQuery.isLoading && <LoadingState label="Cargando alertas..." />}
        {alertsQuery.isError && <ErrorState error={alertsQuery.error} retry={() => alertsQuery.refetch()} />}
        {alertsQuery.data && alertsQuery.data.length === 0 && (
          <p className="py-4 text-center text-sm text-gray-500">No hay alertas sin leer.</p>
        )}
        {alertsQuery.data && alertsQuery.data.length > 0 && (
          <ul className="divide-y divide-gray-100">
            {alertsQuery.data.slice(0, 8).map((alert) => (
              <li key={alert.id} className="flex items-center justify-between gap-3 py-3">
                <div className="flex items-center gap-3">
                  <AlertLevelBadge level={alert.level} />
                  <span className="text-sm text-gray-700">{alert.message}</span>
                </div>
                <span className="whitespace-nowrap text-xs text-gray-400">{formatDateTime(alert.createdAt)}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
