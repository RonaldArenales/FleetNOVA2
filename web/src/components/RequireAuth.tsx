import { useEffect, type ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../lib/auth';

// Defensa adicional: el login (ver lib/auth.tsx) ya rechaza a los
// conductores antes de guardar cualquier sesion, asi que esto solo cubre
// un token DRIVER que haya quedado en localStorage por otra via. Se usa
// una recarga completa (no <Navigate>) para evitar una carrera entre este
// redireccionamiento y el de "no autenticado" al limpiar la sesion.
export function RequireAuth({ children }: { children: ReactNode }) {
  const { isAuthenticated, user, logout } = useAuth();
  const location = useLocation();
  const isDriver = isAuthenticated && user?.role === 'DRIVER';

  useEffect(() => {
    if (isDriver) {
      logout();
      window.location.replace('/login');
    }
  }, [isDriver, logout]);

  if (!isAuthenticated || isDriver) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <>{children}</>;
}
