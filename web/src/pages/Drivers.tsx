import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api, getApiErrorMessage } from '../lib/api';
import { useAuth } from '../lib/auth';
import type { Driver } from '../types';
import { LoadingState, ErrorState, EmptyState } from '../components/QueryState';
import { DriverFormModal, type DriverFormValues } from '../components/DriverFormModal';

export function Drivers() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const canWrite = user?.role === 'ADMIN' || user?.role === 'OPERATOR';

  const [showCreate, setShowCreate] = useState(false);
  const [editing, setEditing] = useState<Driver | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  const driversQuery = useQuery({
    queryKey: ['drivers'],
    queryFn: async () => {
      const { data } = await api.get<Driver[]>('/drivers');
      return data;
    },
  });

  const createMutation = useMutation({
    mutationFn: async (values: DriverFormValues) => {
      const { data } = await api.post<Driver>('/drivers', values);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['drivers'] });
      setShowCreate(false);
      setFormError(null);
    },
    onError: (error) => setFormError(getApiErrorMessage(error, 'No se pudo crear el conductor.')),
  });

  const updateMutation = useMutation({
    mutationFn: async (values: DriverFormValues) => {
      if (!editing) throw new Error('Sin conductor seleccionado');
      const { data } = await api.patch<Driver>(`/drivers/${editing.id}`, values);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['drivers'] });
      setEditing(null);
      setFormError(null);
    },
    onError: (error) => setFormError(getApiErrorMessage(error, 'No se pudo actualizar el conductor.')),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await api.delete(`/drivers/${id}`);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['drivers'] }),
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="icon-badge">
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z"
              />
            </svg>
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-gray-900">Conductores</h1>
            <p className="text-sm text-gray-500">Personal habilitado para conducir la flota</p>
          </div>
        </div>
        {canWrite && (
          <button
            type="button"
            onClick={() => setShowCreate(true)}
            className="btn-primary"
          >
            + Nuevo conductor
          </button>
        )}
      </div>

      <div className="card overflow-hidden">
        {driversQuery.isLoading && <LoadingState label="Cargando conductores..." />}
        {driversQuery.isError && (
          <div className="p-4">
            <ErrorState error={driversQuery.error} retry={() => driversQuery.refetch()} />
          </div>
        )}
        {driversQuery.data && driversQuery.data.length === 0 && (
          <div className="p-4">
            <EmptyState>Aún no hay conductores registrados.</EmptyState>
          </div>
        )}
        {driversQuery.data && driversQuery.data.length > 0 && (
          <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50 text-xs uppercase text-gray-500">
              <tr>
                <th className="px-4 py-3">Código</th>
                <th className="px-4 py-3">Nombre</th>
                <th className="px-4 py-3">Documento</th>
                <th className="px-4 py-3">Licencia</th>
                <th className="px-4 py-3">Teléfono</th>
                {canWrite && <th className="px-4 py-3 text-right">Acciones</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {driversQuery.data.map((d) => (
                <tr key={d.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-mono text-xs text-gray-500">{d.id}</td>
                  <td className="px-4 py-3 font-medium text-gray-800">{d.name}</td>
                  <td className="px-4 py-3 text-gray-600">{d.documentId}</td>
                  <td className="px-4 py-3 text-gray-600">{d.licenseNumber}</td>
                  <td className="px-4 py-3 text-gray-600">{d.phone ?? '—'}</td>
                  {canWrite && (
                    <td className="px-4 py-3 text-right">
                      <button
                        type="button"
                        onClick={() => {
                          setFormError(null);
                          setEditing(d);
                        }}
                        className="mr-3 link-action"
                      >
                        Editar
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          if (confirm(`¿Eliminar al conductor ${d.name}?`)) {
                            deleteMutation.mutate(d.id);
                          }
                        }}
                        className="link-danger"
                      >
                        Eliminar
                      </button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
          </div>
        )}
      </div>

      {showCreate && (
        <DriverFormModal
          onClose={() => {
            setShowCreate(false);
            setFormError(null);
          }}
          onSubmit={(values) => createMutation.mutate(values)}
          submitting={createMutation.isPending}
          errorMessage={formError}
        />
      )}

      {editing && (
        <DriverFormModal
          initial={editing}
          onClose={() => {
            setEditing(null);
            setFormError(null);
          }}
          onSubmit={(values) => updateMutation.mutate(values)}
          submitting={updateMutation.isPending}
          errorMessage={formError}
        />
      )}
    </div>
  );
}
