import { useQuery } from '@tanstack/react-query';
import { api } from '../../lib/api';
import type { TireWear } from '../../types';
import { Section } from './Section';
import { LoadingState, ErrorState } from '../QueryState';

export function TireWearSection({ vehicleId }: { vehicleId: string }) {
  const query = useQuery({
    queryKey: ['vehicle', vehicleId, 'tire-wear'],
    queryFn: async () => {
      const { data } = await api.get<TireWear>(`/vehicles/${vehicleId}/tire-wear`);
      return data;
    },
  });

  const wearPercent = query.data ? Math.min(100, Math.max(0, query.data.wearPercent)) : 0;
  const barColor = wearPercent >= 90 ? 'bg-red-500' : wearPercent >= 70 ? 'bg-yellow-500' : 'bg-green-500';

  return (
    <Section title="Desgaste de llantas">
      {query.isLoading && <LoadingState label="Cargando desgaste de llantas..." />}
      {query.isError && <ErrorState error={query.error} retry={() => query.refetch()} />}
      {query.data && (
        <div className="space-y-3">
          <div className="h-4 w-full overflow-hidden rounded-full bg-gray-100">
            <div className={`h-full ${barColor} transition-all`} style={{ width: `${wearPercent}%` }} />
          </div>
          <div className="grid grid-cols-2 gap-3 text-sm text-gray-600 sm:grid-cols-4">
            <div>
              <p className="text-xs uppercase text-gray-400">Desgaste</p>
              <p className="font-semibold text-gray-800">{query.data.wearPercent.toFixed(1)}%</p>
            </div>
            <div>
              <p className="text-xs uppercase text-gray-400">Km recorridos</p>
              <p className="font-semibold text-gray-800">{query.data.kmSinceInstalled.toLocaleString('es')} km</p>
            </div>
            <div>
              <p className="text-xs uppercase text-gray-400">Vida útil</p>
              <p className="font-semibold text-gray-800">{query.data.tireLifeKm.toLocaleString('es')} km</p>
            </div>
            <div>
              <p className="text-xs uppercase text-gray-400">Km restantes</p>
              <p className="font-semibold text-gray-800">{query.data.remainingKm.toLocaleString('es')} km</p>
            </div>
          </div>
        </div>
      )}
    </Section>
  );
}
