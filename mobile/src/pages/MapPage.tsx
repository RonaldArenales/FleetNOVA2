import { useQuery } from '@tanstack/react-query';
import { api } from '../lib/api';
import type { DriverMeResponse, VehicleStatusResponse } from '../types';
import { PageHeader } from '../components/PageHeader';
import { LoadingState, ErrorState, EmptyState } from '../components/QueryState';
import { VehicleMap } from '../components/VehicleMap';

function formatDateTime(value?: string) {
  if (!value) return '—';
  try {
    return new Date(value).toLocaleString('es', { dateStyle: 'short', timeStyle: 'short' });
  } catch {
    return value;
  }
}

export function MapPage() {
  const meQuery = useQuery({
    queryKey: ['driver-me'],
    queryFn: async () => {
      const { data } = await api.get<DriverMeResponse>('/driver/me');
      return data;
    },
  });

  const statusQuery = useQuery({
    queryKey: ['driver-vehicle-status'],
    queryFn: async () => {
      const { data } = await api.get<VehicleStatusResponse>('/driver/vehicle/status');
      return data;
    },
    enabled: !!meQuery.data?.vehicle,
    refetchInterval: 2000,
  });

  return (
    <div className="flex h-screen flex-col">
      <PageHeader title="Ubicación" subtitle={meQuery.data?.vehicle ? `Vehículo ${meQuery.data.vehicle.plate}` : undefined} />

      <div className="flex-1">
        {(meQuery.isLoading || statusQuery.isLoading) && <LoadingState label="Cargando ubicación..." />}
        {meQuery.isError && (
          <div className="p-4">
            <ErrorState error={meQuery.error} retry={() => meQuery.refetch()} />
          </div>
        )}
        {statusQuery.isError && (
          <div className="p-4">
            <ErrorState error={statusQuery.error} retry={() => statusQuery.refetch()} />
          </div>
        )}
        {statusQuery.data && !statusQuery.data.gps && (
          <div className="p-4">
            <EmptyState>Aún no hay datos de ubicación para tu vehículo.</EmptyState>
          </div>
        )}
        {statusQuery.data?.gps && meQuery.data?.vehicle && (
          <div className="flex h-full flex-col">
            <div className="min-h-0 flex-1">
              <VehicleMap
                lat={statusQuery.data.gps.lat}
                lng={statusQuery.data.gps.lng}
                speedKph={statusQuery.data.gps.speedKph}
                plate={meQuery.data.vehicle.plate}
              />
            </div>
            <div className="border-t border-gray-200 bg-white p-4 pb-[max(1rem,env(safe-area-inset-bottom))] text-sm text-gray-600">
              Velocidad: <span className="font-semibold">{statusQuery.data.gps.speedKph.toFixed(0)} km/h</span> · Actualizado:{' '}
              {formatDateTime(statusQuery.data.gps.timestamp)}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
