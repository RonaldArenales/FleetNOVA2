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
    <div className="relative flex min-h-screen flex-col justify-end overflow-hidden bg-ink-950 sm:justify-center">
      <img
        src="/img/hero-night-highway.jpg"
        alt=""
        aria-hidden="true"
        className="absolute inset-0 h-full w-full object-cover opacity-70"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-ink-950 via-ink-950/80 to-ink-950/20" aria-hidden="true" />

      <div className="relative mx-auto w-full max-w-sm px-6 pb-10 pt-[max(2.5rem,env(safe-area-inset-top))]">
        <div className="mb-8">
          <div className="mb-6 flex items-center gap-2.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-400 shadow-lg shadow-brand-400/20">
              <svg className="h-5 w-5 text-ink-950" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 01-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 00-3.213-9.193 2.056 2.056 0 00-1.58-.86H14.25M16.5 18.75h-2.25m0-11.25h5.25M3 12h12.75" />
              </svg>
            </div>
            <span className="font-display text-lg font-black uppercase tracking-tight text-white">
              Fleet<span className="text-brand-400">Nova</span>
            </span>
          </div>
          <p className="eyebrow">Acceso para conductores</p>
          <h1 className="mt-2 text-4xl font-black uppercase leading-[0.95] tracking-tight text-white">
            Tu camión,
            <br />
            <span className="text-brand-400">en tu bolsillo.</span>
          </h1>
        </div>

        <div className="rounded-3xl border border-white/10 bg-ink-900/80 p-6 shadow-2xl shadow-black/60 backdrop-blur-xl">
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
              <div className="my-4 flex items-center gap-2 text-[11px] uppercase tracking-wider text-zinc-500">
                <div className="h-px flex-1 bg-white/10" />
                o con tu contraseña
                <div className="h-px flex-1 bg-white/10" />
              </div>
            </div>
          )}

          <form onSubmit={onSubmit} className="space-y-4">
            <div>
              <label htmlFor="email" className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-zinc-400">
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
              <label htmlFor="password" className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-zinc-400">
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

            {serverError && (
              <div className="rounded-xl border border-red-500/25 bg-red-500/10 p-3 text-sm text-red-300">{serverError}</div>
            )}

            <button type="submit" disabled={submitting} className="btn-primary w-full">
              {submitting ? 'Ingresando...' : 'Iniciar sesión'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
