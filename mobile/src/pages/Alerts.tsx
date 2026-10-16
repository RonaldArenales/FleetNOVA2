import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '../lib/api';
import type { Alert } from '../types';
import { PageHeader } from '../components/PageHeader';
import { LoadingState, ErrorState, EmptyState } from '../components/QueryState';
import { AlertLevelBadge } from '../components/Badges';

const PAGE_SIZE = 10;

function formatDateTime(value: string) {
  try {
    return new Date(value).toLocaleString('es', { dateStyle: 'medium', timeStyle: 'short' });
  } catch {
    return value;
  }
}

export function Alerts() {
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  const query = useQuery({
    queryKey: ['driver-alerts', visibleCount],
    queryFn: async () => {
      const { data } = await api.get<Alert[]>('/driver/alerts', { params: { take: visibleCount } });
      return data;
    },
    refetchInterval: 20000,
  });

  // Si llegaron menos alertas de las pedidas, ya no hay mas que cargar.
  const hasMore = (query.data?.length ?? 0) >= visibleCount;

  return (
    <div>
      <PageHeader title="Alertas" subtitle="Notificaciones de tu vehículo" />

      <div className="space-y-3 p-4">
        {query.isLoading && <LoadingState label="Cargando alertas..." />}
        {query.isError && <ErrorState error={query.error} retry={() => query.refetch()} />}
        {query.data && query.data.length === 0 && <EmptyState>No hay alertas para tu vehículo.</EmptyState>}
        {query.data?.map((alert) => (
          <div key={alert.id} className={`card p-4 ${alert.read ? '' : 'ring-1 ring-indigo-200'}`}>
            <div className="flex items-center justify-between gap-2">
              <AlertLevelBadge level={alert.level} />
              {!alert.read && <span className="h-2 w-2 rounded-full bg-indigo-500" aria-label="Sin leer" />}
            </div>
            <p className="mt-2 text-sm text-gray-700">{alert.message}</p>
            <p className="mt-1 text-xs text-gray-400">{formatDateTime(alert.createdAt)}</p>
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
