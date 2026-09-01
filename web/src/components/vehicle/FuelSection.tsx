import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { api, getApiErrorMessage } from '../../lib/api';
import type { FuelConsumption, FuelLog } from '../../types';
import { Section } from './Section';
import { LoadingState, ErrorState, EmptyState } from '../QueryState';

interface FuelLogForm {
  litersAdded: number;
  cost?: number;
  odometerAtFill: number;
}

function formatDate(value: string) {
  try {
    return new Date(value).toLocaleDateString('es', { dateStyle: 'medium' });
  } catch {
    return value;
  }
}

export function FuelSection({ vehicleId }: { vehicleId: string }) {
  const queryClient = useQueryClient();
  const [formError, setFormError] = useState<string | null>(null);

  const logsQuery = useQuery({
    queryKey: ['vehicle', vehicleId, 'fuel-logs'],
    queryFn: async () => {
      const { data } = await api.get<FuelLog[]>(`/vehicles/${vehicleId}/fuel-logs`);
      return data;
    },
  });

  const consumptionQuery = useQuery({
    queryKey: ['vehicle', vehicleId, 'fuel-consumption'],
    queryFn: async () => {
      const { data } = await api.get<FuelConsumption>(`/vehicles/${vehicleId}/fuel-consumption`);
      return data;
    },
  });

  const { register, handleSubmit, reset, formState: { errors } } = useForm<FuelLogForm>();

  const createMutation = useMutation({
    mutationFn: async (values: FuelLogForm) => {
      const { data } = await api.post<FuelLog>(`/vehicles/${vehicleId}/fuel-logs`, values);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vehicle', vehicleId, 'fuel-logs'] });
      queryClient.invalidateQueries({ queryKey: ['vehicle', vehicleId, 'fuel-consumption'] });
      reset();
      setFormError(null);
    },
    onError: (error) => setFormError(getApiErrorMessage(error, 'No se pudo registrar el suministro de combustible.')),
  });

  return (
    <Section title="Combustible">
      <div className="mb-4">
        {consumptionQuery.isLoading && <LoadingState label="Calculando consumo..." />}
        {consumptionQuery.isError && <ErrorState error={consumptionQuery.error} />}
        {consumptionQuery.data && 'litersPer100Km' in consumptionQuery.data && (
          <p className="text-sm text-gray-700">
            Consumo estimado:{' '}
            <span className="font-semibold text-gray-900">{consumptionQuery.data.litersPer100Km.toFixed(2)} L/100km</span>
          </p>
        )}
        {consumptionQuery.data && 'message' in consumptionQuery.data && (
          <p className="text-sm text-gray-500">{consumptionQuery.data.message}</p>
        )}
      </div>

      {logsQuery.isLoading && <LoadingState label="Cargando historial de combustible..." />}
      {logsQuery.isError && <ErrorState error={logsQuery.error} retry={() => logsQuery.refetch()} />}
      {logsQuery.data && logsQuery.data.length === 0 && <EmptyState>Sin registros de combustible.</EmptyState>}
      {logsQuery.data && logsQuery.data.length > 0 && (
        <div className="mb-4 overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="bg-gray-50 text-xs uppercase text-gray-500">
            <tr>
              <th className="px-3 py-2">Fecha</th>
              <th className="px-3 py-2">Litros</th>
              <th className="px-3 py-2">Costo</th>
              <th className="px-3 py-2">Odómetro</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {logsQuery.data.map((log) => (
              <tr key={log.id}>
                <td className="px-3 py-2 text-gray-600">{formatDate(log.timestamp)}</td>
                <td className="px-3 py-2 text-gray-600">{log.litersAdded} L</td>
                <td className="px-3 py-2 text-gray-600">{log.cost != null ? `$${log.cost.toFixed(2)}` : '—'}</td>
                <td className="px-3 py-2 text-gray-600">{log.odometerAtFill.toLocaleString('es')} km</td>
              </tr>
            ))}
          </tbody>
        </table>
        </div>
      )}

      <form
        onSubmit={handleSubmit((values) =>
          createMutation.mutate({
            litersAdded: Number(values.litersAdded),
            cost: values.cost !== undefined && !Number.isNaN(Number(values.cost)) ? Number(values.cost) : undefined,
            odometerAtFill: Number(values.odometerAtFill),
          }),
        )}
        className="grid grid-cols-1 gap-3 border-t border-gray-100 pt-4 sm:grid-cols-4"
      >
        <div>
          <label className="mb-1 block text-xs font-medium text-gray-600">Litros</label>
          <input
            type="number"
            step="0.01"
            className="field-input w-full"
            {...register('litersAdded', { required: true, valueAsNumber: true, min: 0.01 })}
          />
          {errors.litersAdded && <p className="mt-1 text-xs text-red-600">Requerido</p>}
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-gray-600">Costo (opcional)</label>
          <input
            type="number"
            step="0.01"
            className="field-input w-full"
            {...register('cost', { valueAsNumber: true })}
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-gray-600">Odómetro</label>
          <input
            type="number"
            className="field-input w-full"
            {...register('odometerAtFill', { required: true, valueAsNumber: true, min: 0 })}
          />
          {errors.odometerAtFill && <p className="mt-1 text-xs text-red-600">Requerido</p>}
        </div>
        <div className="flex items-end">
          <button
            type="submit"
            disabled={createMutation.isPending}
            className="btn-primary w-full"
          >
            {createMutation.isPending ? 'Guardando...' : 'Registrar'}
          </button>
        </div>
      </form>
      {formError && <p className="mt-2 text-sm text-red-600">{formError}</p>}
    </Section>
  );
}
