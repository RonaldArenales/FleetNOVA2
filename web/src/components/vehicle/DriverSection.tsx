import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api, getApiErrorMessage } from '../../lib/api';
import type { Driver } from '../../types';
import { Section } from './Section';
import { LoadingState, ErrorState } from '../QueryState';

export function DriverSection({ vehicleId, canWrite }: { vehicleId: string; canWrite: boolean }) {
  const queryClient = useQueryClient();
  const [selectedDriverId, setSelectedDriverId] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const driversQuery = useQuery({
    queryKey: ['drivers'],
    queryFn: async () => {
      const { data } = await api.get<Driver[]>('/drivers');
      return data;
    },
  });

  const assignMutation = useMutation({
    mutationFn: async (driverId: string) => {
      await api.post(`/vehicles/${vehicleId}/assign-driver`, { driverId });
    },
    onSuccess: () => {
      setError(null);
      setSuccess('Conductor asignado correctamente.');
      queryClient.invalidateQueries({ queryKey: ['vehicle', vehicleId] });
    },
    onError: (err) => {
      setSuccess(null);
      setError(getApiErrorMessage(err, 'No se pudo asignar el conductor.'));
    },
  });

  return (
    <Section title="Conductor asignado">
      {driversQuery.isLoading && <LoadingState label="Cargando conductores..." />}
      {driversQuery.isError && <ErrorState error={driversQuery.error} retry={() => driversQuery.refetch()} />}
      {driversQuery.data && (
        <div className="space-y-3">
          <p className="text-sm text-gray-500">
            La API no expone directamente el conductor asignado a un vehículo; usa el siguiente formulario para asignar uno.
          </p>
          {canWrite ? (
            <div className="flex flex-wrap items-center gap-3">
              <select
                value={selectedDriverId}
                onChange={(e) => setSelectedDriverId(e.target.value)}
                className="field-input"
              >
                <option value="">Selecciona un conductor...</option>
                {driversQuery.data.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name} — {d.documentId}
                  </option>
                ))}
              </select>
              <button
                type="button"
                disabled={!selectedDriverId || assignMutation.isPending}
                onClick={() => selectedDriverId && assignMutation.mutate(selectedDriverId)}
                className="btn-primary"
              >
                {assignMutation.isPending ? 'Asignando...' : 'Asignar conductor'}
              </button>
            </div>
          ) : (
            <p className="text-sm text-gray-500">No tienes permisos para asignar conductores.</p>
          )}
          {error && <p className="text-sm text-red-600">{error}</p>}
          {success && <p className="text-sm text-green-600">{success}</p>}
        </div>
      )}
    </Section>
  );
}
