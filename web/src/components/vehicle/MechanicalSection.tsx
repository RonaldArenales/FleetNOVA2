import { Section } from './Section';
import { EmptyState } from '../QueryState';
import { formatKm } from '../../lib/format';
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
    <div className="rounded-md border border-ink-800 bg-ink-900/60 p-3">
      <p className="text-xs font-medium uppercase text-ink-500">{label}</p>
      <p className="mt-1 font-mono text-lg font-semibold tabular-nums text-ink-50">{value}</p>
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
            <Metric label="Temp. motor" value={`${obd.engineTempC.toFixed(1)} °C`} />
            <Metric label="Voltaje batería" value={`${obd.batteryVoltage.toFixed(1)} V`} />
            <Metric label="Odómetro OBD" value={`${formatKm(obd.odometerKm)} km`} />
          </div>

          <div className="flex flex-wrap items-center gap-4">
            <span
              className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium ${
                obd.engineOn ? 'bg-emerald-500/10 text-emerald-400' : 'bg-ink-500/10 text-ink-400'
              }`}
            >
              Motor {obd.engineOn ? 'encendido' : 'apagado'}
            </span>
            <span
              className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium ${
                obd.transmissionOk ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'
              }`}
            >
              Transmisión {obd.transmissionOk ? 'correcta' : 'con problemas'}
            </span>
          </div>

          <div>
            <p className="mb-2 text-sm font-medium text-ink-300">Códigos de falla</p>
            {obd.faultCodes.length === 0 ? (
              <p className="text-sm text-ink-500">Sin códigos de falla activos.</p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {obd.faultCodes.map((code) => (
                  <span key={code} className="rounded-full bg-rose-500/10 px-2.5 py-0.5 font-mono text-xs font-medium text-rose-400">
                    {code}
                  </span>
                ))}
              </div>
            )}
          </div>

          <p className="text-xs text-ink-600">Última actualización: {formatDateTime(obd.timestamp)}</p>
        </div>
      )}
    </Section>
  );
}
