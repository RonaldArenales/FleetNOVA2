import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { api } from '../lib/api';
import type { Trip } from '../types';
import { LoadingState, ErrorState, EmptyState } from '../components/QueryState';

function formatDateTime(value: string) {
  try {
    return new Date(value).toLocaleString('es', { dateStyle: 'short', timeStyle: 'short' });
  } catch {
    return value;
  }
}

export function Trips() {
  const navigate = useNavigate();

  const query = useQuery({
    queryKey: ['driver-trips'],
    queryFn: async () => {
      const { data } = await api.get<Trip[]>('/driver/vehicle/trips');
      return data;
    },
  });

  return (
    <div>
      <header className="sticky top-0 z-10 flex items-center gap-3 border-b border-gray-200 bg-white/95 px-5 py-4 backdrop-blur pt-[max(1rem,env(safe-area-inset-top))]">
        <button type="button" onClick={() => navigate(-1)} className="text-indigo-600" aria-label="Volver">
          ←
        </button>
        <div>
          <h1 className="text-lg font-bold text-gray-800">Recorridos</h1>
          <p className="text-xs text-gray-500">Historial de viajes de tu vehículo</p>
        </div>
      </header>

      <div className="space-y-3 p-4">
        {query.isLoading && <LoadingState label="Cargando recorridos..." />}
        {query.isError && <ErrorState error={query.error} retry={() => query.refetch()} />}
        {query.data && query.data.length === 0 && <EmptyState>Aún no hay recorridos registrados.</EmptyState>}
        {query.data?.map((trip, idx) => (
          <div key={`${trip.startTime}-${idx}`} className="card p-4">
            <div className="flex items-center justify-between text-sm">
              <span className="font-semibold text-gray-800">{trip.distanceKm.toFixed(1)} km</span>
              <span className="text-gray-500">{Math.round(trip.durationMinutes)} min</span>
            </div>
            <p className="mt-1 text-xs text-gray-500">
              {formatDateTime(trip.startTime)} → {formatDateTime(trip.endTime)}
            </p>
            <p className="mt-1 text-xs text-gray-400">Velocidad promedio: {trip.avgSpeedKph.toFixed(1)} km/h</p>
          </div>
        ))}
      </div>
    </div>
  );
}
