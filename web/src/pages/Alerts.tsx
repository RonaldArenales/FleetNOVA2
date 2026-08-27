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
    mutationFn: async (id: string) => {
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
      <div>
        <h1 className="text-2xl font-bold text-gray-800">Alertas</h1>
        <p className="text-sm text-gray-500">Notificaciones generadas por la flota</p>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <select
          value={vehicleId}
          onChange={(e) => setVehicleId(e.target.value)}
          className="rounded-md border border-gray-300 px-3 py-2 text-sm"
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

      <div className="overflow-hidden rounded-lg bg-white shadow-sm">
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
                <tr key={alert.id} className={alert.read ? '' : 'bg-blue-50/40'}>
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
                        className="text-blue-600 hover:underline"
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
