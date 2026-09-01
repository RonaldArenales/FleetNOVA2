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
    mutationFn: async (id: number) => {
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
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="icon-badge">
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z"
              />
            </svg>
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-gray-900">Usuarios</h1>
            <p className="text-sm text-gray-500">Cuentas con acceso a la plataforma</p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => setShowCreate(true)}
          className="btn-primary"
        >
          + Nuevo usuario
        </button>
      </div>

      <div className="card overflow-hidden">
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
          <div className="overflow-x-auto">
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
                      className="mr-3 link-action"
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
                      className="link-danger disabled:cursor-not-allowed disabled:text-gray-300 disabled:hover:no-underline"
                    >
                      Eliminar
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
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
