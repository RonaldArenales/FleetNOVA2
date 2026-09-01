import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { api, getApiErrorMessage } from '../lib/api';
import { useAuth } from '../lib/auth';
import type { Vehicle, VehicleStatusResponse } from '../types';
import { LoadingState, ErrorState } from '../components/QueryState';
import { VehicleStatusBadge } from '../components/Badges';
import { VehicleFormModal, type VehicleFormValues } from '../components/VehicleFormModal';
import { LocationSection } from '../components/vehicle/LocationSection';
import { MechanicalSection } from '../components/vehicle/MechanicalSection';
import { TireWearSection } from '../components/vehicle/TireWearSection';
import { FuelSection } from '../components/vehicle/FuelSection';
import { MaintenanceSection } from '../components/vehicle/MaintenanceSection';
import { TripsSection } from '../components/vehicle/TripsSection';
import { DriverSection } from '../components/vehicle/DriverSection';

export function VehicleDetail() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const canWrite = user?.role === 'ADMIN' || user?.role === 'OPERATOR';

  const [editing, setEditing] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const vehicleQuery = useQuery({
    queryKey: ['vehicle', id],
    queryFn: async () => {
      const { data } = await api.get<Vehicle>(`/vehicles/${id}`);
      return data;
    },
    enabled: !!id,
  });

  const statusQuery = useQuery({
    queryKey: ['vehicle', id, 'status'],
    queryFn: async () => {
      const { data } = await api.get<VehicleStatusResponse>(`/vehicles/${id}/status`);
      return data;
    },
    enabled: !!id,
    refetchInterval: 2000,
  });

  const updateMutation = useMutation({
    mutationFn: async (values: VehicleFormValues) => {
      const { data } = await api.patch<Vehicle>(`/vehicles/${id}`, values);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vehicle', id] });
      queryClient.invalidateQueries({ queryKey: ['vehicles'] });
      setEditing(false);
      setFormError(null);
    },
    onError: (error) => setFormError(getApiErrorMessage(error, 'No se pudo actualizar el vehículo.')),
  });

  if (!id) {
    return <ErrorState error={new Error('Identificador de vehículo inválido.')} />;
  }

  return (
    <div className="space-y-6">
      <button type="button" onClick={() => navigate('/vehiculos')} className="text-sm link-action">
        ← Volver a vehículos
      </button>

      {vehicleQuery.isLoading && <LoadingState label="Cargando vehículo..." />}
      {vehicleQuery.isError && <ErrorState error={vehicleQuery.error} retry={() => vehicleQuery.refetch()} />}

      {vehicleQuery.data && (
        <>
          <div className="flex flex-wrap items-start justify-between gap-4 card p-5">
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-3xl font-bold tracking-tight text-gray-900">{vehicleQuery.data.plate}</h1>
                <VehicleStatusBadge status={vehicleQuery.data.status} />
              </div>
              <p className="mt-1 text-sm text-gray-500">
                {vehicleQuery.data.brand} {vehicleQuery.data.model} · {vehicleQuery.data.year}
              </p>
              <p className="mt-1 text-sm text-gray-500">Odómetro: {vehicleQuery.data.odometerKm.toLocaleString('es')} km</p>
              {vehicleQuery.data.vin && <p className="mt-1 text-xs text-gray-400">VIN: {vehicleQuery.data.vin}</p>}
            </div>
            {canWrite && (
              <button
                type="button"
                onClick={() => {
                  setFormError(null);
                  setEditing(true);
                }}
                className="btn-secondary"
              >
                Editar vehículo
              </button>
            )}
          </div>

          {statusQuery.isLoading && <LoadingState label="Cargando estado del vehículo..." />}
          {statusQuery.isError && <ErrorState error={statusQuery.error} retry={() => statusQuery.refetch()} />}

          <LocationSection gps={statusQuery.data?.gps ?? null} plate={vehicleQuery.data.plate} />
          <MechanicalSection obd={statusQuery.data?.obd ?? null} />
          <TireWearSection vehicleId={id} />
          <FuelSection vehicleId={id} />
          <MaintenanceSection vehicleId={id} />
          <TripsSection vehicleId={id} />
          <DriverSection vehicleId={id} canWrite={canWrite} />

          {editing && (
            <VehicleFormModal
              initial={vehicleQuery.data}
              onClose={() => {
                setEditing(false);
                setFormError(null);
              }}
              onSubmit={(values) => updateMutation.mutate(values)}
              submitting={updateMutation.isPending}
              errorMessage={formError}
            />
          )}
        </>
      )}

      {!vehicleQuery.isLoading && !vehicleQuery.data && !vehicleQuery.isError && (
        <p className="text-sm text-gray-500">
          Vehículo no encontrado. <Link to="/vehiculos" className="link-action">Volver</Link>
        </p>
      )}
    </div>
  );
}
