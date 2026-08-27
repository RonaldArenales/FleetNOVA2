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

function StatCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-lg bg-white p-5 shadow-sm">
      <p className="text-sm font-medium text-gray-500">{label}</p>
      <p className="mt-2 text-3xl font-bold text-gray-800">{value}</p>
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
      <div>
        <h1 className="text-2xl font-bold text-gray-800">Dashboard</h1>
        <p className="text-sm text-gray-500">Resumen general de la flota</p>
      </div>

      {summaryQuery.isLoading && <LoadingState label="Cargando resumen..." />}
      {summaryQuery.isError && <ErrorState error={summaryQuery.error} retry={() => summaryQuery.refetch()} />}
      {summaryQuery.data && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
          <StatCard label="Vehículos activos" value={summaryQuery.data.activeVehicles} />
          <StatCard label="Total de vehículos" value={summaryQuery.data.totalVehicles} />
          <StatCard label="Alertas sin leer" value={summaryQuery.data.unreadAlerts} />
          <StatCard label="Mantenimientos próximos" value={summaryQuery.data.maintenancesDue} />
          <StatCard
            label="Consumo promedio (L/100km)"
            value={
              summaryQuery.data.avgFuelConsumptionLper100km != null
                ? summaryQuery.data.avgFuelConsumptionLper100km.toFixed(1)
                : 'Sin datos'
            }
          />
        </div>
      )}

      <div className="rounded-lg bg-white p-5 shadow-sm">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-800">Alertas recientes sin leer</h2>
          <Link to="/alertas" className="text-sm font-medium text-blue-600 hover:underline">
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
