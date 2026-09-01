import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '../lib/api';
import type { FleetReport } from '../types';
import { LoadingState, ErrorState, EmptyState } from '../components/QueryState';

function toDateInputValue(date: Date) {
  return date.toISOString().slice(0, 10);
}

function defaultFrom() {
  const d = new Date();
  d.setDate(d.getDate() - 30);
  return toDateInputValue(d);
}

export function Reports() {
  const [from, setFrom] = useState(defaultFrom());
  const [to, setTo] = useState(toDateInputValue(new Date()));

  const reportQuery = useQuery({
    queryKey: ['reports-fleet', { from, to }],
    queryFn: async () => {
      const { data } = await api.get<FleetReport>('/reports/fleet', {
        params: { from, to },
      });
      return data;
    },
  });

  const vehicles = reportQuery.data?.vehicles ?? [];
  const totals = vehicles.reduce(
    (acc, v) => ({
      totalDistanceKm: acc.totalDistanceKm + v.totalDistanceKm,
      fuelConsumedLiters: acc.fuelConsumedLiters + v.fuelConsumedLiters,
      alertsCount: acc.alertsCount + v.alertsCount,
      maintenanceEventsCount: acc.maintenanceEventsCount + v.maintenanceEventsCount,
    }),
    { totalDistanceKm: 0, fuelConsumedLiters: 0, alertsCount: 0, maintenanceEventsCount: 0 },
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="icon-badge">
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z"
            />
          </svg>
        </div>
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900">Reportes</h1>
          <p className="text-sm text-gray-500">Resumen de operación y mantenimiento por vehículo</p>
        </div>
      </div>

      <div className="card flex flex-wrap items-end gap-3 p-4">
        <div>
          <label className="mb-1 block text-xs font-medium text-gray-500">Desde</label>
          <input
            type="date"
            value={from}
            max={to}
            onChange={(e) => setFrom(e.target.value)}
            className="field-input"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-gray-500">Hasta</label>
          <input
            type="date"
            value={to}
            min={from}
            onChange={(e) => setTo(e.target.value)}
            className="field-input"
          />
        </div>
      </div>

      <div className="card overflow-hidden">
        {reportQuery.isLoading && <LoadingState label="Generando reporte..." />}
        {reportQuery.isError && (
          <div className="p-4">
            <ErrorState error={reportQuery.error} retry={() => reportQuery.refetch()} />
          </div>
        )}
        {reportQuery.data && vehicles.length === 0 && (
          <div className="p-4">
            <EmptyState>No hay vehículos registrados para generar el reporte.</EmptyState>
          </div>
        )}
        {reportQuery.data && vehicles.length > 0 && (
          <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50 text-xs uppercase text-gray-500">
              <tr>
                <th className="px-4 py-3">Vehículo</th>
                <th className="px-4 py-3 text-right">Distancia (km)</th>
                <th className="px-4 py-3 text-right">Combustible (L)</th>
                <th className="px-4 py-3 text-right">Alertas</th>
                <th className="px-4 py-3 text-right">Mantenimientos</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {vehicles.map((v) => (
                <tr key={v.vehicleId}>
                  <td className="px-4 py-3 font-medium text-gray-800">{v.plate}</td>
                  <td className="px-4 py-3 text-right text-gray-600">{v.totalDistanceKm.toFixed(1)}</td>
                  <td className="px-4 py-3 text-right text-gray-600">{v.fuelConsumedLiters.toFixed(1)}</td>
                  <td className="px-4 py-3 text-right text-gray-600">{v.alertsCount}</td>
                  <td className="px-4 py-3 text-right text-gray-600">{v.maintenanceEventsCount}</td>
                </tr>
              ))}
            </tbody>
            <tfoot className="border-t border-gray-200 bg-gray-50 font-semibold text-gray-800">
              <tr>
                <td className="px-4 py-3">Total flota</td>
                <td className="px-4 py-3 text-right">{totals.totalDistanceKm.toFixed(1)}</td>
                <td className="px-4 py-3 text-right">{totals.fuelConsumedLiters.toFixed(1)}</td>
                <td className="px-4 py-3 text-right">{totals.alertsCount}</td>
                <td className="px-4 py-3 text-right">{totals.maintenanceEventsCount}</td>
              </tr>
            </tfoot>
          </table>
          </div>
        )}
      </div>
    </div>
  );
}
