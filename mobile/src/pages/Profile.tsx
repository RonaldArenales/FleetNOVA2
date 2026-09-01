import { useQuery } from '@tanstack/react-query';
import { api } from '../lib/api';
import { useAuth } from '../lib/auth';
import type { DriverMeResponse } from '../types';
import { PageHeader } from '../components/PageHeader';
import { LoadingState, ErrorState } from '../components/QueryState';

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
          <div className="card divide-y divide-gray-100">
            <div className="p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">Código de conductor</p>
              <p className="mt-0.5 font-mono text-sm text-gray-800">{meQuery.data.driver.id}</p>
            </div>
            <div className="p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">Nombre</p>
              <p className="mt-0.5 text-sm text-gray-800">{meQuery.data.driver.name}</p>
            </div>
            <div className="p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">Documento</p>
              <p className="mt-0.5 text-sm text-gray-800">{meQuery.data.driver.documentId}</p>
            </div>
            <div className="p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">Licencia</p>
              <p className="mt-0.5 text-sm text-gray-800">{meQuery.data.driver.licenseNumber}</p>
            </div>
            {meQuery.data.driver.phone && (
              <div className="p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">Teléfono</p>
                <p className="mt-0.5 text-sm text-gray-800">{meQuery.data.driver.phone}</p>
              </div>
            )}
            <div className="p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">Correo de acceso</p>
              <p className="mt-0.5 text-sm text-gray-800">{user?.email}</p>
            </div>
          </div>
        )}

        <button type="button" onClick={logout} className="btn-secondary w-full">
          Cerrar sesión
        </button>
      </div>
    </div>
  );
}
