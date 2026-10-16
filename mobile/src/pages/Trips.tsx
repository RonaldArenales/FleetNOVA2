import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { api } from '../lib/api';
import type { Trip } from '../types';
import { LoadingState, ErrorState, EmptyState } from '../components/QueryState';

const PAGE_SIZE = 10;

function formatDateTime(value: string) {
  try {
    return new Date(value).toLocaleString('es', { dateStyle: 'short', timeStyle: 'short' });
  } catch {
    return value;
  }
}

export function Trips() {
  const navigate = useNavigate();
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  const query = useQuery({
    queryKey: ['driver-trips', visibleCount],
    queryFn: async () => {
      const { data } = await api.get<Trip[]>('/driver/vehicle/trips', { params: { take: visibleCount } });
      return data;
    },
  });

  // Si llegaron menos viajes de los pedidos, ya no hay mas que cargar.
  const hasMore = (query.data?.length ?? 0) >= visibleCount;

  return (
    <div>
      <header className="sticky top-0 z-10 flex items-center gap-3 border-b border-white/5 bg-ink-950/85 px-5 py-4 backdrop-blur-md pt-[max(1rem,env(safe-area-inset-top))]">
        <button type="button" onClick={() => navigate(-1)} className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-400 font-bold text-ink-950" aria-label="Volver">
          ←
        </button>
        <div>
          <p className="eyebrow">Historial de viajes de tu vehículo</p>
          <h1 className="mt-0.5 text-2xl font-black uppercase leading-tight tracking-tight text-white">Recorridos</h1>
        </div>
      </header>

      <div className="space-y-3 p-4">
        {query.isLoading && <LoadingState label="Cargando recorridos..." />}
        {query.isError && <ErrorState error={query.error} retry={() => query.refetch()} />}
        {query.data && query.data.length === 0 && <EmptyState>Aún no hay recorridos registrados.</EmptyState>}
        {query.data?.map((trip, idx) => (
          <div key={`${trip.startTime}-${idx}`} className="card p-4">
            <div className="flex items-center justify-between text-sm">
              <span className="font-display text-2xl font-black text-white">{trip.distanceKm.toFixed(1)} km</span>
              <span className="text-zinc-400">{Math.round(trip.durationMinutes)} min</span>
            </div>
            <p className="mt-1 text-xs text-zinc-400">
              {formatDateTime(trip.startTime)} → {formatDateTime(trip.endTime)}
            </p>
            <p className="mt-1 text-xs text-zinc-500">Velocidad promedio: {trip.avgSpeedKph.toFixed(1)} km/h</p>
          </div>
        ))}
        {query.data && query.data.length > 0 && hasMore && (
          <button
            type="button"
            onClick={() => setVisibleCount((n) => n + PAGE_SIZE)}
            disabled={query.isFetching}
            className="btn-secondary w-full"
          >
            {query.isFetching ? 'Cargando...' : 'Ver más'}
          </button>
        )}
      </div>
    </div>
  );
}
