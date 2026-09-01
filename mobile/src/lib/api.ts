import axios from 'axios';

const AUTH_STORAGE_KEY = 'fleetnova.conductor.auth';

export interface StoredAuth {
  token: string;
  user: {
    id: number;
    name: string;
    email: string;
    role: 'ADMIN' | 'OPERATOR' | 'VIEWER' | 'DRIVER';
  };
}

export function getStoredAuth(): StoredAuth | null {
  try {
    const raw = localStorage.getItem(AUTH_STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as StoredAuth;
  } catch {
    return null;
  }
}

export function setStoredAuth(auth: StoredAuth | null) {
  if (auth) {
    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(auth));
  } else {
    localStorage.removeItem(AUTH_STORAGE_KEY);
  }
}

export const AUTH_STORAGE_EVENT = 'fleetnova.conductor.auth.cleared';

export const baseURL = import.meta.env.VITE_API_URL ?? 'http://localhost:4000/api';
const webAppURL = import.meta.env.VITE_WEB_APP_URL ?? 'http://localhost:5173';

export const api = axios.create({
  baseURL,
});

api.interceptors.request.use((config) => {
  const auth = getStoredAuth();
  if (auth?.token) {
    config.headers = config.headers ?? {};
    config.headers.Authorization = `Bearer ${auth.token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error?.response?.status === 401) {
      setStoredAuth(null);
      window.dispatchEvent(new Event(AUTH_STORAGE_EVENT));
      if (window.location.pathname !== '/login') {
        // Igual que un cierre de sesión manual: la sesión se acabó, así que
        // vuelve a la página principal del sitio en vez del login propio de
        // esta app.
        window.location.href = `${webAppURL}/login`;
      }
    }
    return Promise.reject(error);
  },
);

export function getApiErrorMessage(error: unknown, fallback = 'Ocurrió un error inesperado. Inténtalo de nuevo.'): string {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data as { error?: string } | undefined;
    if (data?.error) return data.error;
    if (error.code === 'ERR_NETWORK') {
      return 'No se pudo conectar con el servidor. Verifica tu conexión.';
    }
    if (error.message) return error.message;
  }
  return fallback;
}
