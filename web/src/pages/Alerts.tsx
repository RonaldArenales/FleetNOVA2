import { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';
import type { Alert, Vehicle } from '../types';
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
  const queryClient = useQueryClient();
  const [vehicleId, setVehicleId] = useState('');
  const [onlyUnread, setOnlyUnread] = useState(false);
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  // Si cambian los filtros, se vuelve a empezar desde las 10 mas recientes.
  useEffect(() => {
    setVisibleCount(PAGE_SIZE);
  }, [vehicleId, onlyUnread]);

  const vehiclesQuery = useQuery({
    queryKey: ['vehicles', {}],
    queryFn: async () => {
      const { data } = await api.get<Vehicle[]>('/vehicles');
      return data;
    },
  });

  const alertsQuery = useQuery({
    queryKey: ['alerts', { vehicleId, onlyUnread, visibleCount }],
    queryFn: async () => {
      const { data } = await api.get<Alert[]>('/alerts', {
        params: {
          vehicleId: vehicleId || undefined,
          unread: onlyUnread || undefined,
          take: visibleCount,
        },
      });
      return data;
    },
  });

  // Si llegaron menos alertas de las pedidas, ya no hay mas que cargar.
  const hasMore = (alertsQuery.data?.length ?? 0) >= visibleCount;

  const markReadMutation = useMutation({
    mutationFn: async (id: number) => {
      await api.patch(`/alerts/${id}/read`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['alerts'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-summary'] });
    },
  });

  const plateById = new Map((vehiclesQuery.data ?? []).map((v) => [v.id, v.plate]));

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="icon-badge">
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0"
            />
          </svg>
        </div>
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-ink-50">Alertas</h1>
          <p className="text-sm text-ink-500">Notificaciones generadas por la flota</p>
        </div>
      </div>

      <div className="card flex flex-wrap items-center gap-3 p-4">
        <select
          value={vehicleId}
          onChange={(e) => setVehicleId(e.target.value)}
          className="field-input"
        >
          <option value="">Todos los vehículos</option>
          {(vehiclesQuery.data ?? []).map((v) => (
            <option key={v.id} value={v.id}>
              {v.plate}
            </option>
          ))}
        </select>
        <label className="flex items-center gap-2 text-sm text-ink-400">
          <input type="checkbox" checked={onlyUnread} onChange={(e) => setOnlyUnread(e.target.checked)} />
          Solo no leídas
        </label>
      </div>

      <div className="card overflow-hidden">
        {alertsQuery.isLoading && <LoadingState label="Cargando alertas..." />}
        {alertsQuery.isError && (
          <div className="p-4">
            <ErrorState error={alertsQuery.error} retry={() => alertsQuery.refetch()} />
          </div>
        )}
        {alertsQuery.data && alertsQuery.data.length === 0 && (
          <div className="p-4">
            <EmptyState>No hay alertas con los filtros seleccionados.</EmptyState>
          </div>
        )}
        {alertsQuery.data && alertsQuery.data.length > 0 && (
          <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="table-head">
              <tr>
                <th className="px-4 py-3">Nivel</th>
                <th className="px-4 py-3">Mensaje</th>
                <th className="px-4 py-3">Vehículo</th>
                <th className="px-4 py-3">Fecha</th>
                <th className="px-4 py-3">Estado</th>
                <th className="px-4 py-3 text-right">Acción</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ink-800">
              {alertsQuery.data.map((alert) => (
                <tr key={alert.id} className={alert.read ? '' : 'bg-indigo-500/5'}>
                  <td className="px-4 py-3">
                    <AlertLevelBadge level={alert.level} />
                  </td>
                  <td className="px-4 py-3 text-ink-300">{alert.message}</td>
                  <td className="px-4 py-3 font-mono text-ink-400">{plateById.get(alert.vehicleId) ?? alert.vehicleId}</td>
                  <td className="px-4 py-3 text-ink-500">{formatDateTime(alert.createdAt)}</td>
                  <td className="px-4 py-3 text-ink-400">{alert.read ? 'Leída' : 'Sin leer'}</td>
                  <td className="px-4 py-3 text-right">
                    {!alert.read && (
                      <button
                        type="button"
                        onClick={() => markReadMutation.mutate(alert.id)}
                        className="link-action"
                      >
                        Marcar como leída
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
        )}
        {alertsQuery.data && alertsQuery.data.length > 0 && hasMore && (
          <div className="p-4">
            <button
              type="button"
              onClick={() => setVisibleCount((n) => n + PAGE_SIZE)}
              disabled={alertsQuery.isFetching}
              className="btn-secondary w-full"
            >
              {alertsQuery.isFetching ? 'Cargando...' : 'Ver más'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
