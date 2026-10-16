import { useQuery } from '@tanstack/react-query';
import { api } from '../lib/api';
import type { Alert } from '../types';
import { PageHeader } from '../components/PageHeader';
import { LoadingState, ErrorState, EmptyState } from '../components/QueryState';
import { AlertLevelBadge } from '../components/Badges';

function formatDateTime(value: string) {
  try {
    return new Date(value).toLocaleString('es', { dateStyle: 'medium', timeStyle: 'short' });
  } catch {
    return value;
  }
}

export function Alerts() {
  const query = useQuery({
    queryKey: ['driver-alerts'],
    queryFn: async () => {
      const { data } = await api.get<Alert[]>('/driver/alerts');
      return data;
    },
    refetchInterval: 20000,
  });

  return (
    <div>
      <PageHeader title="Alertas" subtitle="Notificaciones de tu vehículo" />

      <div className="space-y-3 p-4">
        {query.isLoading && <LoadingState label="Cargando alertas..." />}
        {query.isError && <ErrorState error={query.error} retry={() => query.refetch()} />}
        {query.data && query.data.length === 0 && <EmptyState>No hay alertas para tu vehículo.</EmptyState>}
        {query.data?.map((alert) => (
          <div key={alert.id} className={`card p-4 ${alert.read ? '' : 'ring-1 ring-brand-400/40'}`}>
            <div className="flex items-center justify-between gap-2">
              <AlertLevelBadge level={alert.level} />
              {!alert.read && <span className="h-2 w-2 rounded-full bg-brand-400" aria-label="Sin leer" />}
            </div>
            <p className="mt-2 text-sm text-zinc-200">{alert.message}</p>
            <p className="mt-1 text-xs text-zinc-500">{formatDateTime(alert.createdAt)}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
