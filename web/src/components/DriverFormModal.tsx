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
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
            {...register('name', { required: 'El nombre es obligatorio' })}
          />
          {errors.name && <p className="mt-1 text-xs text-red-600">{errors.name.message}</p>}
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">Documento de identidad</label>
          <input
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
            {...register('documentId', { required: 'El documento es obligatorio' })}
          />
          {errors.documentId && <p className="mt-1 text-xs text-red-600">{errors.documentId.message}</p>}
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">Número de licencia</label>
          <input
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
            {...register('licenseNumber', { required: 'La licencia es obligatoria' })}
          />
          {errors.licenseNumber && <p className="mt-1 text-xs text-red-600">{errors.licenseNumber.message}</p>}
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">Teléfono (opcional)</label>
          <input className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm" {...register('phone')} />
        </div>

        {errorMessage && <div className="rounded-md bg-red-50 p-2 text-sm text-red-700">{errorMessage}</div>}

        <div className="flex justify-end gap-2 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-60"
          >
            {submitting ? 'Guardando...' : 'Guardar'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
