import { useEffect, useState } from 'react';
import axios from 'axios';
import { Link, useSearchParams } from 'react-router-dom';
import { baseURL, setStoredAuth, type StoredAuth } from '../lib/api';

// Recibe el token emitido por la pagina principal (landing) tras validar las
// credenciales alli mismo, evitando pedirle al conductor que inicie sesion
// una segunda vez en esta app.
export function Handoff() {
  const [searchParams] = useSearchParams();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const token = searchParams.get('token');
    if (!token) {
      window.location.replace('/login');
      return;
    }

    let cancelled = false;

    (async () => {
      try {
        const response = await axios.get(`${baseURL}/auth/me`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const user = response.data as StoredAuth['user'];

        if (user.role !== 'DRIVER') {
          if (!cancelled) setError('Esta cuenta no es de conductor.');
          return;
        }

        setStoredAuth({ token, user });
        // Recarga completa (no navigate de React Router): así el contexto de
        // auth se inicializa desde cero con la sesión recién guardada, en
        // vez de arrastrar en memoria la identidad de una sesión anterior
        // que haya quedado abierta en esta misma pestaña.
        if (!cancelled) window.location.replace('/');
      } catch {
        if (!cancelled) setError('No se pudo validar la sesión. Intenta iniciar sesión de nuevo.');
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [searchParams]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-slate-900 px-6 text-center">
      {!error ? (
        <>
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-white/20 border-t-white" />
          <p className="text-sm text-white/70">Iniciando sesión...</p>
        </>
      ) : (
        <div className="w-full max-w-sm rounded-2xl bg-white p-7 shadow-2xl shadow-black/40">
          <p className="text-sm text-red-600">{error}</p>
          <Link to="/login" className="btn-primary mt-4 inline-block w-full text-center">
            Ir a iniciar sesión
          </Link>
        </div>
      )}
    </div>
  );
}
