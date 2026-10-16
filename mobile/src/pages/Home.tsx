import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { api } from '../lib/api';
import { useAuth } from '../lib/auth';
import type { DriverMeResponse, VehicleStatusResponse } from '../types';
import { PageHeader } from '../components/PageHeader';
import { LoadingState, ErrorState, EmptyState } from '../components/QueryState';
import { VehicleStatusBadge } from '../components/Badges';

function formatDateTime(value?: string) {
  if (!value) return '—';
  try {
    return new Date(value).toLocaleString('es', { dateStyle: 'short', timeStyle: 'short' });
  } catch {
    return value;
  }
}

export function Home() {
  const { user } = useAuth();

  const meQuery = useQuery({
    queryKey: ['driver-me'],
    queryFn: async () => {
      const { data } = await api.get<DriverMeResponse>('/driver/me');
      return data;
    },
  });

  const vehicleId = meQuery.data?.vehicle?.id;

  const statusQuery = useQuery({
    queryKey: ['driver-vehicle-status'],
    queryFn: async () => {
      const { data } = await api.get<VehicleStatusResponse>('/driver/vehicle/status');
      return data;
    },
    enabled: !!vehicleId,
    refetchInterval: 2000,
  });

  const firstName = user?.name?.split(' ')[0] ?? 'Conductor';

  return (
    <div>
      <PageHeader title={`Hola, ${firstName}`} subtitle="Resumen de tu vehículo asignado" />

      <div className="space-y-4 p-4">
        {meQuery.isLoading && <LoadingState label="Cargando tu vehículo..." />}
        {meQuery.isError && <ErrorState error={meQuery.error} retry={() => meQuery.refetch()} />}

        {meQuery.data && !meQuery.data.vehicle && (
          <EmptyState>Aún no tienes un vehículo asignado. Contacta a tu administrador.</EmptyState>
        )}

        {meQuery.data?.vehicle && (
          <>
            <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-[url('/img/hero-night-highway.jpg')] bg-cover bg-center">
              <div className="bg-gradient-to-t from-ink-950 via-ink-950/75 to-ink-950/30 p-5 pt-16">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="eyebrow">Tu vehículo</p>
                    <p className="mt-1 font-display text-4xl font-black uppercase leading-none tracking-tight text-white">
                      {meQuery.data.vehicle.plate}
                    </p>
                    <p className="mt-2 text-sm text-zinc-300">
                      {meQuery.data.vehicle.brand} {meQuery.data.vehicle.model} · {meQuery.data.vehicle.year}
                    </p>
                  </div>
                  <VehicleStatusBadge status={meQuery.data.vehicle.status} />
                </div>
                <div className="mt-5 inline-flex items-baseline gap-2 rounded-2xl border border-white/10 bg-ink-950/60 px-4 py-2.5 backdrop-blur">
                  <span className="font-display text-2xl font-black text-brand-400">
                    {meQuery.data.vehicle.odometerKm.toLocaleString('es')}
                  </span>
                  <span className="text-xs uppercase tracking-wider text-zinc-400">km recorridos</span>
                </div>
              </div>
            </div>

            {statusQuery.isLoading && <LoadingState label="Cargando estado..." />}
            {statusQuery.isError && <ErrorState error={statusQuery.error} retry={() => statusQuery.refetch()} />}

            {statusQuery.data && (
              <>
                <Link to="/mapa" className="card flex items-start gap-3 p-4 active:bg-white/[0.03]">
                  <div className="icon-badge mt-0.5">
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z"
                      />
                    </svg>
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-zinc-500">Ubicación</p>
                    {statusQuery.data.gps ? (
                      <>
                        <p className="text-sm text-zinc-200">
                          Velocidad: <span className="font-semibold">{statusQuery.data.gps.speedKph.toFixed(0)} km/h</span>
                        </p>
                        <p className="text-xs text-zinc-500">Actualizado: {formatDateTime(statusQuery.data.gps.timestamp)}</p>
                        <p className="mt-2 text-xs font-medium text-brand-400">Ver en el mapa →</p>
                      </>
                    ) : (
                      <p className="text-sm text-zinc-400">Sin datos de ubicación todavía.</p>
                    )}
                  </div>
                </Link>

                <div className="card p-4">
                  <div className="mb-3 flex items-center gap-3">
                    <div className="icon-badge">
                      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M11.42 15.17L17.25 21A2.652 2.652 0 0021 17.25l-5.877-5.877M11.42 15.17l2.496-3.03c.317-.384.74-.626 1.208-.766M11.42 15.17l-4.655 5.653a2.548 2.548 0 11-3.586-3.586l6.837-5.63m5.108-.233c.55-.164 1.163-.188 1.743-.14a4.5 4.5 0 004.486-6.336l-3.276 3.277a3.004 3.004 0 01-2.25-2.25l3.276-3.276a4.5 4.5 0 00-6.336 4.486c.091 1.076-.071 2.264-.904 2.95l-.102.085m-1.745 1.437L5.909 7.5H4.5L2.25 3.75l1.5-1.5L7.5 4.5v1.409l4.26 4.26"
                        />
                      </svg>
                    </div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">Estado mecánico</p>
                  </div>
                  {statusQuery.data.obd ? (
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-[11px] uppercase tracking-wider text-zinc-500">RPM</p>
                        <p className="mt-0.5 font-display text-xl font-black text-white">{statusQuery.data.obd.rpm}</p>
                      </div>
                      <div>
                        <p className="text-[11px] uppercase tracking-wider text-zinc-500">Temp. motor</p>
                        <p className="mt-0.5 font-display text-xl font-black text-white">{statusQuery.data.obd.engineTempC.toFixed(1)} °C</p>
                      </div>
                      <div>
                        <p className="text-[11px] uppercase tracking-wider text-zinc-500">Batería</p>
                        <p className="mt-0.5 font-display text-xl font-black text-white">{statusQuery.data.obd.batteryVoltage.toFixed(1)} V</p>
                      </div>
                      <div>
                        <p className="text-[11px] uppercase tracking-wider text-zinc-500">Motor</p>
                        <p className="mt-0.5 font-display text-xl font-black text-white">{statusQuery.data.obd.engineOn ? 'Encendido' : 'Apagado'}</p>
                      </div>
                      {statusQuery.data.obd.faultCodes.length > 0 && (
                        <div className="col-span-2">
                          <p className="text-[11px] uppercase tracking-wider text-zinc-500">Códigos de falla</p>
                          <p className="font-semibold text-rose-400">{statusQuery.data.obd.faultCodes.join(', ')}</p>
                        </div>
                      )}
                    </div>
                  ) : (
                    <p className="text-sm text-zinc-400">Sin datos del motor todavía.</p>
                  )}
                </div>
              </>
            )}

            <Link to="/recorridos" className="card flex items-center justify-between p-4 active:bg-white/[0.03]">
              <span className="text-sm font-medium text-zinc-200">Historial de recorridos</span>
              <span className="text-brand-400">→</span>
            </Link>
          </>
        )}
      </div>
    </div>
  );
}
