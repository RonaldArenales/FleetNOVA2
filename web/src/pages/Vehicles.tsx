import { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { api, getApiErrorMessage } from '../lib/api';
import { useAuth } from '../lib/auth';
import type { Vehicle, VehicleStatus } from '../types';
import { LoadingState, ErrorState, EmptyState } from '../components/QueryState';
import { VehicleStatusBadge } from '../components/Badges';
import { VehicleFormModal, type VehicleFormValues } from '../components/VehicleFormModal';

const statusOptions: { value: VehicleStatus | ''; label: string }[] = [
  { value: '', label: 'Todos los estados' },
  { value: 'ACTIVE', label: 'Activo' },
  { value: 'MAINTENANCE', label: 'En mantenimiento' },
  { value: 'INACTIVE', label: 'Inactivo' },
];

export function Vehicles() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const canWrite = user?.role === 'ADMIN' || user?.role === 'OPERATOR';

  const [plateInput, setPlateInput] = useState('');
  const [plate, setPlate] = useState('');
  const [status, setStatus] = useState<VehicleStatus | ''>('');
  const [showCreate, setShowCreate] = useState(false);
  const [editing, setEditing] = useState<Vehicle | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    const t = setTimeout(() => setPlate(plateInput.trim()), 400);
    return () => clearTimeout(t);
  }, [plateInput]);

  const vehiclesQuery = useQuery({
    queryKey: ['vehicles', { plate, status }],
    queryFn: async () => {
      const { data } = await api.get<Vehicle[]>('/vehicles', {
        params: { plate: plate || undefined, status: status || undefined },
      });
      return data;
    },
  });

  const createMutation = useMutation({
    mutationFn: async (values: VehicleFormValues) => {
      const { data } = await api.post<Vehicle>('/vehicles', values);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vehicles'] });
      setShowCreate(false);
      setFormError(null);
    },
    onError: (error) => setFormError(getApiErrorMessage(error, 'No se pudo crear el vehículo.')),
  });

  const updateMutation = useMutation({
    mutationFn: async (values: VehicleFormValues) => {
      if (!editing) throw new Error('Sin vehículo seleccionado');
      const { data } = await api.patch<Vehicle>(`/vehicles/${editing.id}`, values);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vehicles'] });
      setEditing(null);
      setFormError(null);
    },
    onError: (error) => setFormError(getApiErrorMessage(error, 'No se pudo actualizar el vehículo.')),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await api.delete(`/vehicles/${id}`);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['vehicles'] }),
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="icon-badge">
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 01-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 00-3.213-9.193 2.056 2.056 0 00-1.58-.86H14.25M16.5 18.75h-2.25m0-11.25h5.25M3 12h12.75" />
            </svg>
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-gray-900">Vehículos</h1>
            <p className="text-sm text-gray-500">Administra la flota de camiones</p>
          </div>
        </div>
        {canWrite && (
          <button
            type="button"
            onClick={() => setShowCreate(true)}
            className="btn-primary"
          >
            + Nuevo vehículo
          </button>
        )}
      </div>

      <div className="card flex flex-wrap gap-3 p-4">
        <input
          type="text"
          placeholder="Buscar por placa..."
          value={plateInput}
          onChange={(e) => setPlateInput(e.target.value)}
          className="field-input w-full sm:w-64"
        />
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value as VehicleStatus | '')}
          className="field-input"
        >
          {statusOptions.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>

      <div className="card overflow-hidden">
        {vehiclesQuery.isLoading && <LoadingState label="Cargando vehículos..." />}
        {vehiclesQuery.isError && (
          <div className="p-4">
            <ErrorState error={vehiclesQuery.error} retry={() => vehiclesQuery.refetch()} />
          </div>
        )}
        {vehiclesQuery.data && vehiclesQuery.data.length === 0 && (
          <div className="p-4">
            <EmptyState>No se encontraron vehículos con los filtros actuales.</EmptyState>
          </div>
        )}
        {vehiclesQuery.data && vehiclesQuery.data.length > 0 && (
          <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50 text-xs uppercase text-gray-500">
              <tr>
                <th className="px-4 py-3">Placa</th>
                <th className="px-4 py-3">Marca / Modelo</th>
                <th className="px-4 py-3">Año</th>
                <th className="px-4 py-3">Estado</th>
                <th className="px-4 py-3">Odómetro</th>
                {canWrite && <th className="px-4 py-3 text-right">Acciones</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {vehiclesQuery.data.map((v) => (
                <tr
                  key={v.id}
                  onClick={() => navigate(`/vehiculos/${v.id}`)}
                  className="cursor-pointer hover:bg-gray-50"
                >
                  <td className="px-4 py-3 font-medium text-gray-800">{v.plate}</td>
                  <td className="px-4 py-3 text-gray-600">
                    {v.brand} {v.model}
                  </td>
                  <td className="px-4 py-3 text-gray-600">{v.year}</td>
                  <td className="px-4 py-3">
                    <VehicleStatusBadge status={v.status} />
                  </td>
                  <td className="px-4 py-3 text-gray-600">{v.odometerKm.toLocaleString('es')} km</td>
                  {canWrite && (
                    <td className="px-4 py-3 text-right">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setFormError(null);
                          setEditing(v);
                        }}
                        className="mr-3 link-action"
                      >
                        Editar
                      </button>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (confirm(`¿Eliminar el vehículo ${v.plate}?`)) {
                            deleteMutation.mutate(v.id);
                          }
                        }}
                        className="link-danger"
                      >
                        Eliminar
                      </button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
          </div>
        )}
      </div>

      {showCreate && (
        <VehicleFormModal
          onClose={() => {
            setShowCreate(false);
            setFormError(null);
          }}
          onSubmit={(values) => createMutation.mutate(values)}
          submitting={createMutation.isPending}
          errorMessage={formError}
        />
      )}

      {editing && (
        <VehicleFormModal
          initial={editing}
          onClose={() => {
            setEditing(null);
            setFormError(null);
          }}
          onSubmit={(values) => updateMutation.mutate(values)}
          submitting={updateMutation.isPending}
          errorMessage={formError}
        />
      )}
    </div>
  );
}
