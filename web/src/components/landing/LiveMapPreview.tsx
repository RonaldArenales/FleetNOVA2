import { useQuery } from '@tanstack/react-query';
import { api } from '../../lib/api';
import { VehicleMap } from '../VehicleMap';

interface DemoVehicle {
  plate: string;
  brand: string;
  model: string;
  lat: number | null;
  lng: number | null;
  speedKph: number | null;
  updatedAt: string | null;
}

export function LiveMapPreview() {
  const { data, isLoading, isError } = useQuery({
    queryKey: ['public-demo-vehicle'],
    queryFn: async () => {
      const { data } = await api.get<DemoVehicle | null>('/public/demo-vehicle');
      return data;
    },
    refetchInterval: 3000,
  });

  if (isLoading) {
    return (
      <div className="flex h-80 items-center justify-center rounded-3xl border border-white/10 bg-ink-900 text-sm text-zinc-500">
        Cargando mapa...
      </div>
    );
  }

  if (isError || !data || data.lat == null || data.lng == null) {
    return (
      <div className="flex h-80 items-center justify-center rounded-3xl border border-white/10 bg-ink-900 px-6 text-center text-sm text-zinc-500">
        El mapa de muestra no está disponible en este momento.
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-3xl border border-white/10 shadow-2xl shadow-black/40 [&_.h-80]:h-[26rem]">
      <VehicleMap lat={data.lat} lng={data.lng} speedKph={data.speedKph ?? 0} plate={data.plate} />
    </div>
  );
}
