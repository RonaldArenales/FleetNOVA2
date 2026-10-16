import { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';
import { useAuth } from '../lib/auth';
import {
  fetchPasskeys,
  isBiometricLoginAvailable,
  isPasskeyCeremonyCancelled,
  registerPasskey,
  removePasskey,
} from '../lib/webauthn';
import type { DriverMeResponse, WebAuthnCredentialSummary } from '../types';
import { PageHeader } from '../components/PageHeader';
import { LoadingState, ErrorState } from '../components/QueryState';

function formatDate(value: string) {
  try {
    return new Date(value).toLocaleDateString('es', { dateStyle: 'medium' });
  } catch {
    return value;
  }
}

function SecuritySection() {
  const queryClient = useQueryClient();
  const [canRegister, setCanRegister] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    isBiometricLoginAvailable().then((available) => {
      if (!cancelled) setCanRegister(available);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const credentialsQuery = useQuery({
    queryKey: ['webauthn-credentials'],
    queryFn: fetchPasskeys,
  });

  const registerMutation = useMutation({
    mutationFn: () => registerPasskey(navigator.platform || 'Este dispositivo'),
    onSuccess: () => {
      setActionError(null);
      queryClient.invalidateQueries({ queryKey: ['webauthn-credentials'] });
    },
    onError: (error) => {
      setActionError(
        isPasskeyCeremonyCancelled(error)
          ? 'Cancelaste la activación biométrica.'
          : 'No se pudo activar Face ID / Touch ID en este dispositivo.',
      );
    },
  });

  const removeMutation = useMutation({
    mutationFn: (id: number) => removePasskey(id),
    onSuccess: () => {
      setActionError(null);
      queryClient.invalidateQueries({ queryKey: ['webauthn-credentials'] });
    },
    onError: () => setActionError('No se pudo quitar esa credencial.'),
  });

  return (
    <div className="card divide-y divide-white/5">
      <div className="p-4">
        <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">Seguridad</p>
        <p className="mt-0.5 text-sm text-zinc-400">Face ID / Touch ID para iniciar sesión sin contraseña</p>
      </div>

      {credentialsQuery.isLoading && (
        <div className="p-4">
          <LoadingState label="Cargando..." />
        </div>
      )}

      {credentialsQuery.data?.map((credential: WebAuthnCredentialSummary) => (
        <div key={credential.id} className="flex items-center justify-between gap-3 p-4">
          <div>
            <p className="text-sm text-zinc-100">{credential.deviceLabel ?? 'Dispositivo'}</p>
            <p className="text-xs text-zinc-500">Activado el {formatDate(credential.createdAt)}</p>
          </div>
          <button
            type="button"
            onClick={() => removeMutation.mutate(credential.id)}
            disabled={removeMutation.isPending}
            className="text-sm font-medium text-red-400 hover:text-red-300"
          >
            Quitar
          </button>
        </div>
      ))}

      {canRegister && (
        <div className="p-4">
          <button
            type="button"
            onClick={() => registerMutation.mutate()}
            disabled={registerMutation.isPending}
            className="btn-secondary w-full"
          >
            {registerMutation.isPending ? 'Activando...' : 'Activar Face ID / Touch ID en este dispositivo'}
          </button>
        </div>
      )}

      {!canRegister && !credentialsQuery.data?.length && (
        <div className="p-4">
          <p className="text-xs text-zinc-500">
            Este navegador no tiene Face ID, Touch ID u otro sensor biométrico disponible.
          </p>
        </div>
      )}

      {actionError && (
        <div className="p-4">
          <p className="text-sm text-red-400">{actionError}</p>
        </div>
      )}
    </div>
  );
}

export function Profile() {
  const { user, logout } = useAuth();

  const meQuery = useQuery({
    queryKey: ['driver-me'],
    queryFn: async () => {
      const { data } = await api.get<DriverMeResponse>('/driver/me');
      return data;
    },
  });

  return (
    <div>
      <PageHeader title="Perfil" subtitle="Tu información como conductor" />

      <div className="space-y-4 p-4">
        {meQuery.isLoading && <LoadingState label="Cargando perfil..." />}
        {meQuery.isError && <ErrorState error={meQuery.error} retry={() => meQuery.refetch()} />}

        {meQuery.data && (
          <div className="card divide-y divide-white/5">
            <div className="p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">Código de conductor</p>
              <p className="mt-0.5 font-mono text-sm text-zinc-100">{meQuery.data.driver.id}</p>
            </div>
            <div className="p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">Nombre</p>
              <p className="mt-0.5 text-sm text-zinc-100">{meQuery.data.driver.name}</p>
            </div>
            <div className="p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">Documento</p>
              <p className="mt-0.5 text-sm text-zinc-100">{meQuery.data.driver.documentId}</p>
            </div>
            <div className="p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">Licencia</p>
              <p className="mt-0.5 text-sm text-zinc-100">{meQuery.data.driver.licenseNumber}</p>
            </div>
            {meQuery.data.driver.phone && (
              <div className="p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">Teléfono</p>
                <p className="mt-0.5 text-sm text-zinc-100">{meQuery.data.driver.phone}</p>
              </div>
            )}
            <div className="p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">Correo de acceso</p>
              <p className="mt-0.5 text-sm text-zinc-100">{user?.email}</p>
            </div>
          </div>
        )}

        <SecuritySection />

        <button type="button" onClick={logout} className="btn-secondary w-full">
          Cerrar sesión
        </button>
      </div>
    </div>
  );
}
