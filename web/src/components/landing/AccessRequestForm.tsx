import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { api, getApiErrorMessage } from '../../lib/api';

interface AccessRequestValues {
  firstName: string;
  lastName: string;
  phone: string;
  email: string;
}

export function AccessRequestForm() {
  const [submitted, setSubmitted] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<AccessRequestValues>();

  const onSubmit = async (values: AccessRequestValues) => {
    setServerError(null);
    setSubmitting(true);
    try {
      await api.post('/public/access-requests', values);
      setSubmitted(true);
      reset();
    } catch (error) {
      setServerError(getApiErrorMessage(error, 'No se pudo enviar la solicitud. Intenta de nuevo.'));
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className="card p-6 text-center">
        <div className="mx-auto mb-3 flex h-11 w-11 items-center justify-center rounded-full border-2 border-emerald-500/20 bg-emerald-500/10 text-emerald-400">
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
          </svg>
        </div>
        <p className="text-sm font-semibold text-white">Solicitud enviada</p>
        <p className="mt-1 text-sm text-zinc-400">
          Recibimos tus datos. Nuestro equipo se pondrá en contacto para darte acceso.
        </p>
        <button type="button" onClick={() => setSubmitted(false)} className="link-action mt-3 text-sm">
          Enviar otra solicitud
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="card space-y-4 p-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="access-firstName" className="mb-1 block text-sm font-medium text-zinc-200">
            Nombres
          </label>
          <input
            id="access-firstName"
            className="field-input w-full"
            {...register('firstName', { required: 'Los nombres son obligatorios' })}
          />
          {errors.firstName && <p className="mt-1 text-xs text-red-400">{errors.firstName.message}</p>}
        </div>
        <div>
          <label htmlFor="access-lastName" className="mb-1 block text-sm font-medium text-zinc-200">
            Apellidos
          </label>
          <input
            id="access-lastName"
            className="field-input w-full"
            {...register('lastName', { required: 'Los apellidos son obligatorios' })}
          />
          {errors.lastName && <p className="mt-1 text-xs text-red-400">{errors.lastName.message}</p>}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="access-phone" className="mb-1 block text-sm font-medium text-zinc-200">
            Teléfono
          </label>
          <input
            id="access-phone"
            type="tel"
            className="field-input w-full"
            {...register('phone', { required: 'El teléfono es obligatorio' })}
          />
          {errors.phone && <p className="mt-1 text-xs text-red-400">{errors.phone.message}</p>}
        </div>
        <div>
          <label htmlFor="access-email" className="mb-1 block text-sm font-medium text-zinc-200">
            Correo electrónico
          </label>
          <input
            id="access-email"
            type="email"
            autoComplete="email"
            className="field-input w-full"
            {...register('email', {
              required: 'El correo es obligatorio',
              pattern: { value: /^\S+@\S+\.\S+$/, message: 'Correo inválido' },
            })}
          />
          {errors.email && <p className="mt-1 text-xs text-red-400">{errors.email.message}</p>}
        </div>
      </div>

      {serverError && <div className="rounded-md bg-red-500/10 p-2 text-sm text-red-300">{serverError}</div>}

      <button type="submit" disabled={submitting} className="btn-primary w-full sm:w-auto">
        {submitting ? 'Enviando...' : 'Enviar solicitud'}
      </button>
    </form>
  );
}
