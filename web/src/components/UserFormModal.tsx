import { useForm } from 'react-hook-form';
import { Modal } from './Modal';
import type { Role, User } from '../types';

export interface UserFormValues {
  name: string;
  email: string;
  password?: string;
  role: Role;
  viewScopeOwnerId?: number | null;
}

export function UserFormModal({
  initial,
  operators,
  onClose,
  onSubmit,
  submitting,
  errorMessage,
}: {
  initial?: User | null;
  operators: User[];
  onClose: () => void;
  onSubmit: (values: UserFormValues) => void;
  submitting: boolean;
  errorMessage?: string | null;
}) {
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<UserFormValues>({
    defaultValues: initial
      ? {
          name: initial.name,
          email: initial.email,
          role: initial.role,
          viewScopeOwnerId: initial.viewScopeOwnerId ?? undefined,
          password: '',
        }
      : { role: 'OPERATOR' },
  });

  const selectedRole = watch('role');

  return (
    <Modal title={initial ? 'Editar usuario' : 'Nuevo usuario'} onClose={onClose}>
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
          <label className="mb-1 block text-sm font-medium text-gray-700">Correo electrónico</label>
          <input
            type="email"
            className="field-input w-full"
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
            className="field-input w-full"
            {...register('password', { required: initial ? false : 'La contraseña es obligatoria' })}
          />
          {errors.password && <p className="mt-1 text-xs text-red-600">{errors.password.message}</p>}
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">Rol</label>
          <select className="field-input w-full" {...register('role')}>
            <option value="ADMIN">Administrador</option>
            <option value="OPERATOR">Operador</option>
            <option value="VIEWER">Observador</option>
          </select>
        </div>

        {selectedRole === 'VIEWER' && (
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Operador asociado</label>
            <select className="field-input w-full" {...register('viewScopeOwnerId', { setValueAs: (v) => (v ? Number(v) : null) })}>
              <option value="">Sin asociar (no verá vehículos)</option>
              {operators.map((op) => (
                <option key={op.id} value={op.id}>
                  {op.name}
                </option>
              ))}
            </select>
            <p className="mt-1 text-xs text-gray-500">
              El observador solo verá la flota de este operador.
            </p>
          </div>
        )}

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
