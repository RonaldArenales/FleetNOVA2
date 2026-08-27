import { Section } from './Section';
import { EmptyState } from '../QueryState';
import type { ObdData } from '../../types';

function formatDateTime(value: string) {
  try {
    return new Date(value).toLocaleString('es', { dateStyle: 'medium', timeStyle: 'short' });
  } catch {
    return value;
  }
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-gray-100 p-3">
      <p className="text-xs font-medium uppercase text-gray-400">{label}</p>
      <p className="mt-1 text-lg font-semibold text-gray-800">{value}</p>
    </div>
  );
}

export function MechanicalSection({ obd }: { obd: ObdData | null }) {
  return (
    <Section title="Estado mecánico">
      {!obd && <EmptyState>No hay datos OBD-II disponibles para este vehículo todavía.</EmptyState>}
      {obd && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <Metric label="RPM" value={obd.rpm.toLocaleString('es')} />
            <Metric label="Temp. motor" value={`${obd.engineTempC} °C`} />
            <Metric label="Voltaje batería" value={`${obd.batteryVoltage} V`} />
            <Metric label="Odómetro OBD" value={`${obd.odometerKm.toLocaleString('es')} km`} />
          </div>

          <div className="flex flex-wrap items-center gap-4">
            <span
              className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium ${
                obd.engineOn ? 'bg-green-100 text-green-800' : 'bg-gray-200 text-gray-700'
              }`}
            >
              Motor {obd.engineOn ? 'encendido' : 'apagado'}
            </span>
            <span
              className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium ${
                obd.transmissionOk ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
              }`}
            >
              Transmisión {obd.transmissionOk ? 'correcta' : 'con problemas'}
            </span>
          </div>

          <div>
            <p className="mb-2 text-sm font-medium text-gray-700">Códigos de falla</p>
            {obd.faultCodes.length === 0 ? (
              <p className="text-sm text-gray-500">Sin códigos de falla activos.</p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {obd.faultCodes.map((code) => (
                  <span key={code} className="rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-medium text-red-800">
                    {code}
                  </span>
                ))}
              </div>
            )}
          </div>

          <p className="text-xs text-gray-400">Última actualización: {formatDateTime(obd.timestamp)}</p>
        </div>
      )}
    </Section>
  );
}
