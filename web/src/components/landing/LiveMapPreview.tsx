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
      <div className="flex h-80 items-center justify-center rounded-xl border border-gray-200 bg-gray-50 text-sm text-gray-400">
        Cargando mapa...
      </div>
    );
  }

  if (isError || !data || data.lat == null || data.lng == null) {
    return (
      <div className="flex h-80 items-center justify-center rounded-xl border border-gray-200 bg-gray-50 px-6 text-center text-sm text-gray-400">
        El mapa de muestra no está disponible en este momento.
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-xl border border-gray-200 shadow-sm">
      <VehicleMap lat={data.lat} lng={data.lng} speedKph={data.speedKph ?? 0} plate={data.plate} />
    </div>
  );
}
