import { useForm } from 'react-hook-form';
import { Modal } from './Modal';
import type { Driver } from '../types';

export interface DriverFormValues {
  name: string;
  documentId: string;
  licenseNumber: string;
  phone?: string;
}

export function DriverFormModal({
  initial,
  onClose,
  onSubmit,
  submitting,
  errorMessage,
}: {
  initial?: Driver | null;
  onClose: () => void;
  onSubmit: (values: DriverFormValues) => void;
  submitting: boolean;
  errorMessage?: string | null;
}) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<DriverFormValues>({
    defaultValues: initial
      ? {
          name: initial.name,
          documentId: initial.documentId,
          licenseNumber: initial.licenseNumber,
          phone: initial.phone ?? '',
        }
      : undefined,
  });

  return (
    <Modal title={initial ? 'Editar conductor' : 'Nuevo conductor'} onClose={onClose}>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">Nombre completo</label>
          <input
            className="field-input w-full"
            {...register('name', { required: 'El nombre es obligatorio' })}
          />
          {errors.name && <p className="mt-1 text-xs text-red-600">{errors.name.message}</p>}
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">Documento de identidad</label>
          <input
            className="field-input w-full"
            {...register('documentId', { required: 'El documento es obligatorio' })}
          />
          {errors.documentId && <p className="mt-1 text-xs text-red-600">{errors.documentId.message}</p>}
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">Número de licencia</label>
          <input
            className="field-input w-full"
            {...register('licenseNumber', { required: 'La licencia es obligatoria' })}
          />
          {errors.licenseNumber && <p className="mt-1 text-xs text-red-600">{errors.licenseNumber.message}</p>}
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">Teléfono (opcional)</label>
          <input className="field-input w-full" {...register('phone')} />
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
