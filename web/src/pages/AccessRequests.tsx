import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';
import type { AccessRequest } from '../types';
import { LoadingState, ErrorState, EmptyState } from '../components/QueryState';

function formatDateTime(value: string) {
  try {
    return new Date(value).toLocaleString('es', { dateStyle: 'medium', timeStyle: 'short' });
  } catch {
    return value;
  }
}

export function AccessRequests() {
  const queryClient = useQueryClient();

  const requestsQuery = useQuery({
    queryKey: ['access-requests'],
    queryFn: async () => {
      const { data } = await api.get<AccessRequest[]>('/access-requests');
      return data;
    },
  });

  const markReadMutation = useMutation({
    mutationFn: async (id: number) => {
      await api.patch(`/access-requests/${id}/read`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['access-requests'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-summary'] });
    },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="icon-badge">
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M18 7.5v3m0 0v3m0-3h3m-3 0h-3m-2.25-4.125a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zM3 19.235v-.11a6.375 6.375 0 0112.75 0v.109A12.318 12.318 0 019.374 21c-2.331 0-4.512-.645-6.374-1.766z"
            />
          </svg>
        </div>
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900">Solicitudes de acceso</h1>
          <p className="text-sm text-gray-500">Personas que pidieron acceso desde la página principal</p>
        </div>
      </div>

      <div className="card overflow-hidden">
        {requestsQuery.isLoading && <LoadingState label="Cargando solicitudes..." />}
        {requestsQuery.isError && (
          <div className="p-4">
            <ErrorState error={requestsQuery.error} retry={() => requestsQuery.refetch()} />
          </div>
        )}
        {requestsQuery.data && requestsQuery.data.length === 0 && (
          <div className="p-4">
            <EmptyState>Aún no hay solicitudes de acceso.</EmptyState>
          </div>
        )}
        {requestsQuery.data && requestsQuery.data.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50 text-xs uppercase text-gray-500">
                <tr>
                  <th className="px-4 py-3">Nombre</th>
                  <th className="px-4 py-3">Teléfono</th>
                  <th className="px-4 py-3">Correo</th>
                  <th className="px-4 py-3">Fecha</th>
                  <th className="px-4 py-3">Estado</th>
                  <th className="px-4 py-3 text-right">Acción</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {requestsQuery.data.map((r) => (
                  <tr key={r.id} className={r.reviewed ? '' : 'bg-indigo-50/50'}>
                    <td className="px-4 py-3 font-medium text-gray-800">
                      {r.firstName} {r.lastName}
                    </td>
                    <td className="px-4 py-3 text-gray-600">{r.phone}</td>
                    <td className="px-4 py-3 text-gray-600">{r.email}</td>
                    <td className="px-4 py-3 text-gray-500">{formatDateTime(r.createdAt)}</td>
                    <td className="px-4 py-3">
                      {r.reviewed ? (
                        <span className="inline-flex items-center rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-0.5 text-xs font-medium text-emerald-700">
                          Atendida
                        </span>
                      ) : (
                        <span className="inline-flex items-center rounded-full border border-amber-200 bg-amber-50 px-2.5 py-0.5 text-xs font-medium text-amber-700">
                          Pendiente
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">
                      {!r.reviewed && (
                        <button
                          type="button"
                          onClick={() => markReadMutation.mutate(r.id)}
                          className="link-action"
                        >
                          Marcar como atendida
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
