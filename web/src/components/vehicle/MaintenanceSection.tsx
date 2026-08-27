import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { api, getApiErrorMessage } from '../../lib/api';
import type { MaintenanceRecord, MaintenanceSchedule } from '../../types';
import { Section } from './Section';
import { LoadingState, ErrorState, EmptyState } from '../QueryState';
import { MaintenanceStatusBadge } from '../Badges';

interface ScheduleForm {
  type: string;
  dueDate?: string;
  dueOdometerKm?: number;
  description?: string;
}

interface RecordForm {
  type: string;
  description?: string;
  cost?: number;
  odometerKm: number;
}

function formatDate(value?: string | null) {
  if (!value) return '—';
  try {
    return new Date(value).toLocaleDateString('es', { dateStyle: 'medium' });
  } catch {
    return value;
  }
}

export function MaintenanceSection({ vehicleId }: { vehicleId: string }) {
  const queryClient = useQueryClient();
  const [scheduleError, setScheduleError] = useState<string | null>(null);
  const [recordError, setRecordError] = useState<string | null>(null);

  const schedulesQuery = useQuery({
    queryKey: ['vehicle', vehicleId, 'maintenance-schedules'],
    queryFn: async () => {
      const { data } = await api.get<MaintenanceSchedule[]>(`/vehicles/${vehicleId}/maintenance-schedules`);
      return data;
    },
  });

  const recordsQuery = useQuery({
    queryKey: ['vehicle', vehicleId, 'maintenance-records'],
    queryFn: async () => {
      const { data } = await api.get<MaintenanceRecord[]>(`/vehicles/${vehicleId}/maintenance-records`);
      return data;
    },
  });

  const scheduleForm = useForm<ScheduleForm>();
  const recordForm = useForm<RecordForm>();

  const createScheduleMutation = useMutation({
    mutationFn: async (values: ScheduleForm) => {
      const { data } = await api.post<MaintenanceSchedule>(`/vehicles/${vehicleId}/maintenance-schedules`, {
        type: values.type,
        dueDate: values.dueDate || undefined,
        dueOdometerKm: values.dueOdometerKm !== undefined && !Number.isNaN(values.dueOdometerKm) ? values.dueOdometerKm : undefined,
        description: values.description || undefined,
      });
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vehicle', vehicleId, 'maintenance-schedules'] });
      scheduleForm.reset();
      setScheduleError(null);
    },
    onError: (error) => setScheduleError(getApiErrorMessage(error, 'No se pudo programar el mantenimiento.')),
  });

  const markDoneMutation = useMutation({
    mutationFn: async (id: string) => {
      const { data } = await api.patch<MaintenanceSchedule>(`/maintenance-schedules/${id}`, { status: 'DONE' });
      return data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['vehicle', vehicleId, 'maintenance-schedules'] }),
  });

  const createRecordMutation = useMutation({
    mutationFn: async (values: RecordForm) => {
      const { data } = await api.post<MaintenanceRecord>(`/vehicles/${vehicleId}/maintenance-records`, {
        type: values.type,
        description: values.description || undefined,
        cost: values.cost !== undefined && !Number.isNaN(values.cost) ? values.cost : undefined,
        odometerKm: values.odometerKm,
      });
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vehicle', vehicleId, 'maintenance-records'] });
      recordForm.reset();
      setRecordError(null);
    },
    onError: (error) => setRecordError(getApiErrorMessage(error, 'No se pudo registrar el mantenimiento.')),
  });

  return (
    <Section title="Mantenimiento">
      <div className="space-y-8">
        <div>
          <h3 className="mb-3 text-sm font-semibold text-gray-700">Mantenimientos programados</h3>
          {schedulesQuery.isLoading && <LoadingState label="Cargando..." />}
          {schedulesQuery.isError && <ErrorState error={schedulesQuery.error} retry={() => schedulesQuery.refetch()} />}
          {schedulesQuery.data && schedulesQuery.data.length === 0 && <EmptyState>Sin mantenimientos programados.</EmptyState>}
          {schedulesQuery.data && schedulesQuery.data.length > 0 && (
            <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50 text-xs uppercase text-gray-500">
                <tr>
                  <th className="px-3 py-2">Tipo</th>
                  <th className="px-3 py-2">Fecha límite</th>
                  <th className="px-3 py-2">Odómetro límite</th>
                  <th className="px-3 py-2">Estado</th>
                  <th className="px-3 py-2 text-right">Acción</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {schedulesQuery.data.map((s) => (
                  <tr key={s.id}>
                    <td className="px-3 py-2 text-gray-700">{s.type}</td>
                    <td className="px-3 py-2 text-gray-600">{formatDate(s.dueDate)}</td>
                    <td className="px-3 py-2 text-gray-600">
                      {s.dueOdometerKm != null ? `${s.dueOdometerKm.toLocaleString('es')} km` : '—'}
                    </td>
                    <td className="px-3 py-2">
                      <MaintenanceStatusBadge status={s.status} />
                    </td>
                    <td className="px-3 py-2 text-right">
                      {s.status === 'SCHEDULED' || s.status === 'OVERDUE' ? (
                        <button
                          type="button"
                          onClick={() => markDoneMutation.mutate(s.id)}
                          className="text-blue-600 hover:underline"
                        >
                          Marcar como realizado
                        </button>
                      ) : (
                        <span className="text-gray-300">—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            </div>
          )}

          <form
            onSubmit={scheduleForm.handleSubmit((values) => createScheduleMutation.mutate(values))}
            className="mt-3 grid grid-cols-1 gap-3 border-t border-gray-100 pt-4 sm:grid-cols-4"
          >
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-600">Tipo</label>
              <input
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                {...scheduleForm.register('type', { required: true })}
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-600">Fecha límite</label>
              <input type="date" className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm" {...scheduleForm.register('dueDate')} />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-600">Odómetro límite</label>
              <input
                type="number"
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                {...scheduleForm.register('dueOdometerKm', { valueAsNumber: true })}
              />
            </div>
            <div className="flex items-end">
              <button
                type="submit"
                disabled={createScheduleMutation.isPending}
                className="w-full rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-60"
              >
                Programar
              </button>
            </div>
            <div className="sm:col-span-4">
              <label className="mb-1 block text-xs font-medium text-gray-600">Descripción (opcional)</label>
              <input className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm" {...scheduleForm.register('description')} />
            </div>
          </form>
          {scheduleError && <p className="mt-2 text-sm text-red-600">{scheduleError}</p>}
        </div>

        <div>
          <h3 className="mb-3 text-sm font-semibold text-gray-700">Historial de mantenimientos realizados</h3>
          {recordsQuery.isLoading && <LoadingState label="Cargando..." />}
          {recordsQuery.isError && <ErrorState error={recordsQuery.error} retry={() => recordsQuery.refetch()} />}
          {recordsQuery.data && recordsQuery.data.length === 0 && <EmptyState>Sin mantenimientos registrados.</EmptyState>}
          {recordsQuery.data && recordsQuery.data.length > 0 && (
            <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50 text-xs uppercase text-gray-500">
                <tr>
                  <th className="px-3 py-2">Tipo</th>
                  <th className="px-3 py-2">Descripción</th>
                  <th className="px-3 py-2">Costo</th>
                  <th className="px-3 py-2">Odómetro</th>
                  <th className="px-3 py-2">Fecha</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {recordsQuery.data.map((r) => (
                  <tr key={r.id}>
                    <td className="px-3 py-2 text-gray-700">{r.type}</td>
                    <td className="px-3 py-2 text-gray-600">{r.description ?? '—'}</td>
                    <td className="px-3 py-2 text-gray-600">{r.cost != null ? `$${r.cost.toFixed(2)}` : '—'}</td>
                    <td className="px-3 py-2 text-gray-600">{r.odometerKm.toLocaleString('es')} km</td>
                    <td className="px-3 py-2 text-gray-600">{formatDate(r.performedAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            </div>
          )}

          <form
            onSubmit={recordForm.handleSubmit((values) => createRecordMutation.mutate(values))}
            className="mt-3 grid grid-cols-1 gap-3 border-t border-gray-100 pt-4 sm:grid-cols-4"
          >
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-600">Tipo</label>
              <input
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                {...recordForm.register('type', { required: true })}
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-600">Costo (opcional)</label>
              <input
                type="number"
                step="0.01"
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                {...recordForm.register('cost', { valueAsNumber: true })}
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-600">Odómetro</label>
              <input
                type="number"
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                {...recordForm.register('odometerKm', { required: true, valueAsNumber: true })}
              />
            </div>
            <div className="flex items-end">
              <button
                type="submit"
                disabled={createRecordMutation.isPending}
                className="w-full rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-60"
              >
                Registrar
              </button>
            </div>
            <div className="sm:col-span-4">
              <label className="mb-1 block text-xs font-medium text-gray-600">Descripción (opcional)</label>
              <input className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm" {...recordForm.register('description')} />
            </div>
          </form>
          {recordError && <p className="mt-2 text-sm text-red-600">{recordError}</p>}
        </div>
      </div>
    </Section>
  );
}
