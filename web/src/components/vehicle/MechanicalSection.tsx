import { Section } from './Section';
import { EmptyState } from '../QueryState';
import type { ObdData } from '../../types';
import { formatKm } from '../../lib/format';

function formatDateTime(value: string) {
  try {
    return new Date(value).toLocaleString('es', { dateStyle: 'medium', timeStyle: 'short' });
  } catch {
    return value;
  }
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-white/5 bg-ink-950/60 p-4">
      <p className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500">{label}</p>
      <p className="mt-1 font-display text-2xl font-black text-white">{value}</p>
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
                obd.engineOn ? 'bg-green-500/15 text-green-200' : 'bg-white/10 text-zinc-200'
              }`}
            >
              Motor {obd.engineOn ? 'encendido' : 'apagado'}
            </span>
            <span
              className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium ${
                obd.transmissionOk ? 'bg-green-500/15 text-green-200' : 'bg-red-500/15 text-red-200'
              }`}
            >
              Transmisión {obd.transmissionOk ? 'correcta' : 'con problemas'}
            </span>
          </div>

          <div>
            <p className="mb-2 text-sm font-medium text-zinc-200">Códigos de falla</p>
            {obd.faultCodes.length === 0 ? (
              <p className="text-sm text-zinc-400">Sin códigos de falla activos.</p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {obd.faultCodes.map((code) => (
                  <span key={code} className="rounded-full bg-red-500/15 px-2.5 py-0.5 text-xs font-medium text-red-200">
                    {code}
                  </span>
                ))}
              </div>
            )}
          </div>

          <p className="text-xs text-zinc-500">Última actualización: {formatDateTime(obd.timestamp)}</p>
        </div>
      )}
    </Section>
  );
}
