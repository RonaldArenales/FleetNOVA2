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
    mutationFn: async (id: string) => {
      await api.delete(`/vehicles/${id}`);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['vehicles'] }),
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Vehículos</h1>
          <p className="text-sm text-gray-500">Administra la flota de camiones</p>
        </div>
        {canWrite && (
          <button
            type="button"
            onClick={() => setShowCreate(true)}
            className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
          >
            + Nuevo vehículo
          </button>
        )}
      </div>

      <div className="flex flex-wrap gap-3">
        <input
          type="text"
          placeholder="Buscar por placa..."
          value={plateInput}
          onChange={(e) => setPlateInput(e.target.value)}
          className="w-64 rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
        />
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value as VehicleStatus | '')}
          className="rounded-md border border-gray-300 px-3 py-2 text-sm"
        >
          {statusOptions.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>

      <div className="overflow-hidden rounded-lg bg-white shadow-sm">
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
                        className="mr-3 text-blue-600 hover:underline"
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
                        className="text-red-600 hover:underline"
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
