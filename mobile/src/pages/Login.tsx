import { useEffect, useState, type FormEvent } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../lib/auth';
import { getRememberedPasskeyEmail, isBiometricLoginAvailable } from '../lib/webauthn';

export function Login() {
  const { login, loginWithPasskey } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState(() => getRememberedPasskeyEmail() ?? '');
  const [password, setPassword] = useState('');
  const [serverError, setServerError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [biometricSubmitting, setBiometricSubmitting] = useState(false);
  const [canUseBiometrics, setCanUseBiometrics] = useState(false);

  const from = (location.state as { from?: { pathname?: string } } | null)?.from?.pathname ?? '/';
  const rememberedEmail = getRememberedPasskeyEmail();

  useEffect(() => {
    let cancelled = false;
    isBiometricLoginAvailable().then((available) => {
      if (!cancelled) setCanUseBiometrics(available);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setServerError(null);
    setSubmitting(true);
    try {
      await login(email, password);
      navigate(from, { replace: true });
    } catch (error) {
      setServerError(error instanceof Error ? error.message : 'No se pudo iniciar sesión.');
    } finally {
      setSubmitting(false);
    }
  };

  const onBiometricLogin = async () => {
    if (!rememberedEmail) return;
    setServerError(null);
    setBiometricSubmitting(true);
    try {
      await loginWithPasskey(rememberedEmail);
      navigate(from, { replace: true });
    } catch (error) {
      setServerError(error instanceof Error ? error.message : 'No se pudo iniciar sesión.');
    } finally {
      setBiometricSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col justify-center bg-slate-900 px-6 py-10">
      <div className="mx-auto w-full max-w-sm rounded-2xl bg-white p-7 shadow-2xl shadow-black/40">
        <div className="mb-6 text-center">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-600">
            <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 01-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 00-3.213-9.193 2.056 2.056 0 00-1.58-.86H14.25M16.5 18.75h-2.25m0-11.25h5.25M3 12h12.75" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">FleetNova</h1>
          <p className="mt-1 text-sm text-gray-500">Acceso para conductores</p>
        </div>

        {canUseBiometrics && rememberedEmail && (
          <div className="mb-5">
            <button
              type="button"
              onClick={onBiometricLogin}
              disabled={biometricSubmitting}
              className="btn-primary flex w-full items-center justify-center gap-2"
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M9 12.75a3 3 0 116 0v4.5a3 3 0 11-6 0v-4.5zM9 12.75V9a3 3 0 016 0v3.75M4.5 12.75a7.5 7.5 0 1115 0v.75"
                />
              </svg>
              {biometricSubmitting ? 'Verificando...' : 'Entrar con Face ID / Touch ID'}
            </button>
            <div className="my-4 flex items-center gap-2 text-xs uppercase tracking-wide text-gray-400">
              <div className="h-px flex-1 bg-gray-200" />
              o con tu contraseña
              <div className="h-px flex-1 bg-gray-200" />
            </div>
          </div>
        )}

        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <label htmlFor="email" className="mb-1 block text-sm font-medium text-gray-700">
              Correo electrónico
            </label>
            <input
              id="email"
              type="email"
              inputMode="email"
              autoComplete="username"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="field-input w-full"
            />
          </div>

          <div>
            <label htmlFor="password" className="mb-1 block text-sm font-medium text-gray-700">
              Contraseña
            </label>
            <input
              id="password"
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="field-input w-full"
            />
          </div>

          {serverError && <div className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{serverError}</div>}

          <button type="submit" disabled={submitting} className="btn-primary w-full">
            {submitting ? 'Ingresando...' : 'Iniciar sesión'}
          </button>
        </form>
      </div>
    </div>
  );
}
