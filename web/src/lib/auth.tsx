import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { api, AUTH_STORAGE_EVENT, getApiErrorMessage, getStoredAuth, setStoredAuth, type StoredAuth } from './api';
import type { LoginResponse, User } from '../types';

interface AuthContextValue {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [auth, setAuth] = useState<StoredAuth | null>(() => getStoredAuth());

  useEffect(() => {
    const handleCleared = () => setAuth(null);
    window.addEventListener(AUTH_STORAGE_EVENT, handleCleared);
    return () => window.removeEventListener(AUTH_STORAGE_EVENT, handleCleared);
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    let data: LoginResponse;
    try {
      const response = await api.post<LoginResponse>('/auth/login', { email, password });
      data = response.data;
    } catch (error) {
      throw new Error(getApiErrorMessage(error, 'No se pudo iniciar sesión. Verifica tus credenciales.'));
    }

    // El actor Conductor solo existe para la app móvil; la plataforma web
    // es exclusiva de ADMIN/OPERATOR/VIEWER. Se rechaza aqui, antes de
    // guardar ninguna sesion, para no dejar nunca a un DRIVER autenticado
    // en el contexto de la web.
    if (data.user.role === 'DRIVER') {
      throw new Error('Esta cuenta es de conductor. La plataforma web es solo para personal administrativo — usa la app móvil.');
    }

    const stored: StoredAuth = { token: data.token, user: data.user };
    setStoredAuth(stored);
    setAuth(stored);
  }, []);

  const logout = useCallback(() => {
    setStoredAuth(null);
    setAuth(null);
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user: auth?.user ?? null,
      token: auth?.token ?? null,
      isAuthenticated: !!auth?.token,
      login,
      logout,
    }),
    [auth, login, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth debe usarse dentro de AuthProvider');
  return ctx;
}
