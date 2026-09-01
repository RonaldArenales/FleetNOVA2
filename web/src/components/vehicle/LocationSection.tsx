import { Section } from './Section';
import { VehicleMap } from '../VehicleMap';
import { EmptyState } from '../QueryState';
import type { GpsPoint } from '../../types';

function formatDateTime(value: string) {
  try {
    return new Date(value).toLocaleString('es', { dateStyle: 'medium', timeStyle: 'short' });
  } catch {
    return value;
  }
}

export function LocationSection({ gps, plate }: { gps: GpsPoint | null; plate: string }) {
  return (
    <Section title="Ubicación">
      {!gps && <EmptyState>Este vehículo aún no ha reportado una posición GPS.</EmptyState>}
      {gps && (
        <div className="space-y-3">
          <VehicleMap lat={gps.lat} lng={gps.lng} speedKph={gps.speedKph} plate={plate} />
          <div className="flex flex-wrap gap-6 text-sm text-gray-600">
            <span>
              <span className="font-medium text-gray-800">Latitud:</span> {gps.lat.toFixed(5)}
            </span>
            <span>
              <span className="font-medium text-gray-800">Longitud:</span> {gps.lng.toFixed(5)}
            </span>
            <span>
              <span className="font-medium text-gray-800">Velocidad:</span> {gps.speedKph.toFixed(2)} km/h
            </span>
            <span>
              <span className="font-medium text-gray-800">Última actualización:</span> {formatDateTime(gps.timestamp)}
            </span>
          </div>
        </div>
      )}
    </Section>
  );
}
