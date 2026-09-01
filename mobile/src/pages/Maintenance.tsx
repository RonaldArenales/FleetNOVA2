import { useQuery } from '@tanstack/react-query';
import { api } from '../lib/api';
import type { MaintenanceSchedule } from '../types';
import { PageHeader } from '../components/PageHeader';
import { LoadingState, ErrorState, EmptyState } from '../components/QueryState';
import { MaintenanceStatusBadge } from '../components/Badges';

function formatDate(value?: string | null) {
  if (!value) return null;
  try {
    return new Date(value).toLocaleDateString('es', { dateStyle: 'medium' });
  } catch {
    return value;
  }
}

export function Maintenance() {
  const query = useQuery({
    queryKey: ['driver-maintenance-schedules'],
    queryFn: async () => {
      const { data } = await api.get<MaintenanceSchedule[]>('/driver/vehicle/maintenance-schedules');
      return data;
    },
  });

  return (
    <div>
      <PageHeader title="Mantenimiento" subtitle="Mantenimientos programados de tu vehículo" />

      <div className="space-y-3 p-4">
        {query.isLoading && <LoadingState label="Cargando mantenimientos..." />}
        {query.isError && <ErrorState error={query.error} retry={() => query.refetch()} />}
        {query.data && query.data.length === 0 && <EmptyState>No hay mantenimientos programados.</EmptyState>}
        {query.data?.map((schedule) => {
          const dueDate = formatDate(schedule.dueDate);
          return (
            <div key={schedule.id} className="card p-4">
              <div className="flex items-start justify-between gap-2">
                <p className="font-semibold text-gray-800">{schedule.type}</p>
                <MaintenanceStatusBadge status={schedule.status} />
              </div>
              {schedule.description && <p className="mt-1 text-sm text-gray-500">{schedule.description}</p>}
              <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-500">
                {dueDate && <span>Fecha límite: {dueDate}</span>}
                {schedule.dueOdometerKm != null && <span>Odómetro límite: {schedule.dueOdometerKm.toLocaleString('es')} km</span>}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
