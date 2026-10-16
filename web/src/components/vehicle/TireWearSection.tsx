import { useQuery } from '@tanstack/react-query';
import { api } from '../../lib/api';
import type { TireWear } from '../../types';
import { Section } from './Section';
import { LoadingState, ErrorState } from '../QueryState';
import { formatKm } from '../../lib/format';

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
          <div className="h-4 w-full overflow-hidden rounded-full bg-white/5">
            <div className={`h-full ${barColor} transition-all`} style={{ width: `${wearPercent}%` }} />
          </div>
          <div className="grid grid-cols-2 gap-3 text-sm text-zinc-400 sm:grid-cols-4">
            <div>
              <p className="text-xs uppercase text-zinc-500">Desgaste</p>
              <p className="font-semibold text-white">{query.data.wearPercent.toFixed(1)}%</p>
            </div>
            <div>
              <p className="text-xs uppercase text-zinc-500">Km recorridos</p>
              <p className="font-semibold text-white">{formatKm(query.data.kmSinceInstalled)} km</p>
            </div>
            <div>
              <p className="text-xs uppercase text-zinc-500">Vida útil</p>
              <p className="font-semibold text-white">{formatKm(query.data.tireLifeKm)} km</p>
            </div>
            <div>
              <p className="text-xs uppercase text-zinc-500">Km restantes</p>
              <p className="font-semibold text-white">{formatKm(query.data.remainingKm)} km</p>
            </div>
          </div>
        </div>
      )}
    </Section>
  );
}
