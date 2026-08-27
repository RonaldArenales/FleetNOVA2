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
    mutationFn: async (id: string) => {
      await api.delete(`/drivers/${id}`);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['drivers'] }),
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Conductores</h1>
          <p className="text-sm text-gray-500">Personal habilitado para conducir la flota</p>
        </div>
        {canWrite && (
          <button
            type="button"
            onClick={() => setShowCreate(true)}
            className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
          >
            + Nuevo conductor
          </button>
        )}
      </div>

      <div className="overflow-hidden rounded-lg bg-white shadow-sm">
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
                        className="mr-3 text-blue-600 hover:underline"
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
                        className="text-red-600 hover:underline"
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
