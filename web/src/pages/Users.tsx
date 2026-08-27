import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api, getApiErrorMessage } from '../lib/api';
import { useAuth } from '../lib/auth';
import type { User } from '../types';
import { LoadingState, ErrorState, EmptyState } from '../components/QueryState';
import { UserFormModal, type UserFormValues } from '../components/UserFormModal';

const roleLabels: Record<string, string> = {
  ADMIN: 'Administrador',
  OPERATOR: 'Operador',
  VIEWER: 'Observador',
};

function formatDate(value?: string) {
  if (!value) return '—';
  try {
    return new Date(value).toLocaleDateString('es', { dateStyle: 'medium' });
  } catch {
    return value;
  }
}

export function Users() {
  const { user: currentUser } = useAuth();
  const queryClient = useQueryClient();

  const [showCreate, setShowCreate] = useState(false);
  const [editing, setEditing] = useState<User | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  const isAdmin = currentUser?.role === 'ADMIN';

  const usersQuery = useQuery({
    queryKey: ['users'],
    queryFn: async () => {
      const { data } = await api.get<User[]>('/users');
      return data;
    },
    enabled: isAdmin,
  });

  const createMutation = useMutation({
    mutationFn: async (values: UserFormValues) => {
      const { data } = await api.post<User>('/users', values);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      setShowCreate(false);
      setFormError(null);
    },
    onError: (error) => setFormError(getApiErrorMessage(error, 'No se pudo crear el usuario.')),
  });

  const updateMutation = useMutation({
    mutationFn: async (values: UserFormValues) => {
      if (!editing) throw new Error('Sin usuario seleccionado');
      const payload: Partial<UserFormValues> = { name: values.name, email: values.email, role: values.role };
      if (values.password) payload.password = values.password;
      const { data } = await api.patch<User>(`/users/${editing.id}`, payload);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      setEditing(null);
      setFormError(null);
    },
    onError: (error) => setFormError(getApiErrorMessage(error, 'No se pudo actualizar el usuario.')),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/users/${id}`);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['users'] }),
  });

  if (!isAdmin) {
    return (
      <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-6 text-sm text-yellow-800">
        No autorizado. Esta sección es exclusiva para usuarios con rol de administrador.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Usuarios</h1>
          <p className="text-sm text-gray-500">Cuentas con acceso a la plataforma</p>
        </div>
        <button
          type="button"
          onClick={() => setShowCreate(true)}
          className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
        >
          + Nuevo usuario
        </button>
      </div>

      <div className="overflow-hidden rounded-lg bg-white shadow-sm">
        {usersQuery.isLoading && <LoadingState label="Cargando usuarios..." />}
        {usersQuery.isError && (
          <div className="p-4">
            <ErrorState error={usersQuery.error} retry={() => usersQuery.refetch()} />
          </div>
        )}
        {usersQuery.data && usersQuery.data.length === 0 && (
          <div className="p-4">
            <EmptyState>Aún no hay usuarios registrados.</EmptyState>
          </div>
        )}
        {usersQuery.data && usersQuery.data.length > 0 && (
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50 text-xs uppercase text-gray-500">
              <tr>
                <th className="px-4 py-3">Nombre</th>
                <th className="px-4 py-3">Correo</th>
                <th className="px-4 py-3">Rol</th>
                <th className="px-4 py-3">Creado</th>
                <th className="px-4 py-3 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {usersQuery.data.map((u) => (
                <tr key={u.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium text-gray-800">{u.name}</td>
                  <td className="px-4 py-3 text-gray-600">{u.email}</td>
                  <td className="px-4 py-3 text-gray-600">{roleLabels[u.role] ?? u.role}</td>
                  <td className="px-4 py-3 text-gray-600">{formatDate(u.createdAt)}</td>
                  <td className="px-4 py-3 text-right">
                    <button
                      type="button"
                      onClick={() => {
                        setFormError(null);
                        setEditing(u);
                      }}
                      className="mr-3 text-blue-600 hover:underline"
                    >
                      Editar
                    </button>
                    <button
                      type="button"
                      disabled={u.id === currentUser?.id}
                      onClick={() => {
                        if (confirm(`¿Eliminar al usuario ${u.name}?`)) {
                          deleteMutation.mutate(u.id);
                        }
                      }}
                      className="text-red-600 hover:underline disabled:cursor-not-allowed disabled:text-gray-300"
                    >
                      Eliminar
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {showCreate && (
        <UserFormModal
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
        <UserFormModal
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
