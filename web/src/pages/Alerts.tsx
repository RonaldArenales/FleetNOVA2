import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';
import type { Alert, Vehicle } from '../types';
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
  const queryClient = useQueryClient();
  const [vehicleId, setVehicleId] = useState('');
  const [onlyUnread, setOnlyUnread] = useState(false);

  const vehiclesQuery = useQuery({
    queryKey: ['vehicles', {}],
    queryFn: async () => {
      const { data } = await api.get<Vehicle[]>('/vehicles');
      return data;
    },
  });

  const alertsQuery = useQuery({
    queryKey: ['alerts', { vehicleId, onlyUnread }],
    queryFn: async () => {
      const { data } = await api.get<Alert[]>('/alerts', {
        params: {
          vehicleId: vehicleId || undefined,
          unread: onlyUnread || undefined,
        },
      });
      return data;
    },
  });

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
          <h1 className="text-3xl font-bold tracking-tight text-gray-900">Alertas</h1>
          <p className="text-sm text-gray-500">Notificaciones generadas por la flota</p>
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
        <label className="flex items-center gap-2 text-sm text-gray-600">
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
            <thead className="bg-gray-50 text-xs uppercase text-gray-500">
              <tr>
                <th className="px-4 py-3">Nivel</th>
                <th className="px-4 py-3">Mensaje</th>
                <th className="px-4 py-3">Vehículo</th>
                <th className="px-4 py-3">Fecha</th>
                <th className="px-4 py-3">Estado</th>
                <th className="px-4 py-3 text-right">Acción</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {alertsQuery.data.map((alert) => (
                <tr key={alert.id} className={alert.read ? '' : 'bg-indigo-50/50'}>
                  <td className="px-4 py-3">
                    <AlertLevelBadge level={alert.level} />
                  </td>
                  <td className="px-4 py-3 text-gray-700">{alert.message}</td>
                  <td className="px-4 py-3 text-gray-600">{plateById.get(alert.vehicleId) ?? alert.vehicleId}</td>
                  <td className="px-4 py-3 text-gray-500">{formatDateTime(alert.createdAt)}</td>
                  <td className="px-4 py-3 text-gray-600">{alert.read ? 'Leída' : 'Sin leer'}</td>
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
      </div>
    </div>
  );
}
