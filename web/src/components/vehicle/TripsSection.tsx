import { useQuery } from '@tanstack/react-query';
import { api } from '../../lib/api';
import type { Trip } from '../../types';
import { Section } from './Section';
import { LoadingState, ErrorState, EmptyState } from '../QueryState';

function formatDate(value: string) {
  try {
    return new Date(value).toLocaleString('es', { dateStyle: 'short', timeStyle: 'short' });
  } catch {
    return value;
  }
}

export function TripsSection({ vehicleId }: { vehicleId: string }) {
  const query = useQuery({
    queryKey: ['vehicle', vehicleId, 'trips'],
    queryFn: async () => {
      const { data } = await api.get<Trip[]>(`/vehicles/${vehicleId}/trips`);
      return data;
    },
  });

  return (
    <Section title="Historial de recorridos">
      {query.isLoading && <LoadingState label="Cargando recorridos..." />}
      {query.isError && <ErrorState error={query.error} retry={() => query.refetch()} />}
      {query.data && query.data.length === 0 && <EmptyState>Aún no hay recorridos registrados.</EmptyState>}
      {query.data && query.data.length > 0 && (
        <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="bg-gray-50 text-xs uppercase text-gray-500">
            <tr>
              <th className="px-3 py-2">Inicio</th>
              <th className="px-3 py-2">Fin</th>
              <th className="px-3 py-2">Distancia</th>
              <th className="px-3 py-2">Duración</th>
              <th className="px-3 py-2">Velocidad promedio</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {query.data.map((trip, idx) => (
              <tr key={`${trip.startTime}-${idx}`}>
                <td className="px-3 py-2 text-gray-600">{formatDate(trip.startTime)}</td>
                <td className="px-3 py-2 text-gray-600">{formatDate(trip.endTime)}</td>
                <td className="px-3 py-2 text-gray-600">{trip.distanceKm.toFixed(1)} km</td>
                <td className="px-3 py-2 text-gray-600">{trip.durationMinutes} min</td>
                <td className="px-3 py-2 text-gray-600">{trip.avgSpeedKph.toFixed(1)} km/h</td>
              </tr>
            ))}
          </tbody>
        </table>
        </div>
      )}
    </Section>
  );
}
