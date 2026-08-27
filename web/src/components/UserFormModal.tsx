import { useForm } from 'react-hook-form';
import { Modal } from './Modal';
import type { Role, User } from '../types';

export interface UserFormValues {
  name: string;
  email: string;
  password?: string;
  role: Role;
}

export function UserFormModal({
  initial,
  onClose,
  onSubmit,
  submitting,
  errorMessage,
}: {
  initial?: User | null;
  onClose: () => void;
  onSubmit: (values: UserFormValues) => void;
  submitting: boolean;
  errorMessage?: string | null;
}) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<UserFormValues>({
    defaultValues: initial
      ? { name: initial.name, email: initial.email, role: initial.role, password: '' }
      : { role: 'OPERATOR' },
  });

  return (
    <Modal title={initial ? 'Editar usuario' : 'Nuevo usuario'} onClose={onClose}>
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
          <label className="mb-1 block text-sm font-medium text-gray-700">Correo electrónico</label>
          <input
            type="email"
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
            {...register('email', { required: 'El correo es obligatorio' })}
          />
          {errors.email && <p className="mt-1 text-xs text-red-600">{errors.email.message}</p>}
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">
            Contraseña {initial && '(dejar en blanco para no cambiar)'}
          </label>
          <input
            type="password"
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
            {...register('password', { required: initial ? false : 'La contraseña es obligatoria' })}
          />
          {errors.password && <p className="mt-1 text-xs text-red-600">{errors.password.message}</p>}
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">Rol</label>
          <select className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm" {...register('role')}>
            <option value="ADMIN">Administrador</option>
            <option value="OPERATOR">Operador</option>
            <option value="VIEWER">Observador</option>
          </select>
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
