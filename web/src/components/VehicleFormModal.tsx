import { useForm } from 'react-hook-form';
import { Modal } from './Modal';
import type { Vehicle, VehicleStatus } from '../types';

export interface VehicleFormValues {
  plate: string;
  brand: string;
  model: string;
  year: number;
  vin?: string;
  status: VehicleStatus;
  odometerKm: number;
  tireInstalledKm: number;
  tireLifeKm: number;
}

export function VehicleFormModal({
  initial,
  onClose,
  onSubmit,
  submitting,
  errorMessage,
}: {
  initial?: Vehicle | null;
  onClose: () => void;
  onSubmit: (values: VehicleFormValues) => void;
  submitting: boolean;
  errorMessage?: string | null;
}) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<VehicleFormValues>({
    defaultValues: initial
      ? {
          plate: initial.plate,
          brand: initial.brand,
          model: initial.model,
          year: initial.year,
          vin: initial.vin ?? '',
          status: initial.status,
          odometerKm: initial.odometerKm,
          tireInstalledKm: initial.tireInstalledKm,
          tireLifeKm: initial.tireLifeKm,
        }
      : {
          status: 'ACTIVE',
          odometerKm: 0,
          tireInstalledKm: 0,
          tireLifeKm: 80000,
        },
  });

  return (
    <Modal title={initial ? 'Editar vehículo' : 'Nuevo vehículo'} onClose={onClose}>
      <form
        onSubmit={handleSubmit((values) =>
          onSubmit({
            ...values,
            year: Number(values.year),
            odometerKm: Number(values.odometerKm),
            tireInstalledKm: Number(values.tireInstalledKm),
            tireLifeKm: Number(values.tireLifeKm),
          }),
        )}
        className="space-y-4"
      >
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Placa</label>
            <input
              className="field-input w-full"
              {...register('plate', { required: 'La placa es obligatoria' })}
            />
            {errors.plate && <p className="mt-1 text-xs text-red-600">{errors.plate.message}</p>}
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Estado</label>
            <select className="field-input w-full" {...register('status')}>
              <option value="ACTIVE">Activo</option>
              <option value="MAINTENANCE">En mantenimiento</option>
              <option value="INACTIVE">Inactivo</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Marca</label>
            <input
              className="field-input w-full"
              {...register('brand', { required: 'La marca es obligatoria' })}
            />
            {errors.brand && <p className="mt-1 text-xs text-red-600">{errors.brand.message}</p>}
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Modelo</label>
            <input
              className="field-input w-full"
              {...register('model', { required: 'El modelo es obligatorio' })}
            />
            {errors.model && <p className="mt-1 text-xs text-red-600">{errors.model.message}</p>}
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Año</label>
            <input
              type="number"
              className="field-input w-full"
              {...register('year', { required: 'El año es obligatorio', valueAsNumber: true })}
            />
            {errors.year && <p className="mt-1 text-xs text-red-600">{errors.year.message}</p>}
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">VIN (opcional)</label>
            <input className="field-input w-full" {...register('vin')} />
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Odómetro (km)</label>
            <input
              type="number"
              className="field-input w-full"
              {...register('odometerKm', { valueAsNumber: true })}
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Km llanta instalada</label>
            <input
              type="number"
              className="field-input w-full"
              {...register('tireInstalledKm', { valueAsNumber: true })}
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Vida útil llanta (km)</label>
            <input
              type="number"
              className="field-input w-full"
              {...register('tireLifeKm', { valueAsNumber: true })}
            />
          </div>
        </div>

        {errorMessage && <div className="rounded-md bg-red-50 p-2 text-sm text-red-700">{errorMessage}</div>}

        <div className="flex justify-end gap-2 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="btn-secondary"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="btn-primary"
          >
            {submitting ? 'Guardando...' : 'Guardar'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
