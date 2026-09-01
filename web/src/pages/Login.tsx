import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useLocation } from 'react-router-dom';
import { api, getApiErrorMessage, setStoredAuth } from '../lib/api';
import type { LoginResponse } from '../types';
import { RotatingBanner } from '../components/landing/RotatingBanner';
import { LiveMapPreview } from '../components/landing/LiveMapPreview';

interface LoginForm {
  email: string;
  password: string;
}

const MOBILE_APP_URL = import.meta.env.VITE_MOBILE_APP_URL ?? 'http://localhost:5174';

const NAV_LINKS = [
  { href: '#caracteristicas', label: 'Características' },
  { href: '#como-funciona', label: 'Cómo funciona' },
  { href: '#mapa', label: 'Mapa en vivo' },
  { href: '#opiniones', label: 'Opiniones' },
  { href: '#actores', label: 'Actores' },
];

const FEATURES = [
  {
    title: 'Ubicación en tiempo real',
    description: 'Cada camión visible en el mapa, con su posición actualizada cada pocos segundos.',
    icon: (
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z"
      />
    ),
  },
  {
    title: 'Diagnóstico OBD-II',
    description: 'RPM, temperatura del motor, voltaje de batería y códigos de falla, en vivo.',
    icon: (
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M11.42 15.17L17.25 21A2.652 2.652 0 0021 17.25l-5.877-5.877M11.42 15.17l2.496-3.03c.317-.384.74-.626 1.208-.766M11.42 15.17l-4.655 5.653a2.548 2.548 0 11-3.586-3.586l6.837-5.63m5.108-.233c.55-.164 1.163-.188 1.743-.14a4.5 4.5 0 004.486-6.336l-3.276 3.277a3.004 3.004 0 01-2.25-2.25l3.276-3.276a4.5 4.5 0 00-6.336 4.486c.091 1.076-.071 2.264-.904 2.95l-.102.085m-1.745 1.437L5.909 7.5H4.5L2.25 3.75l1.5-1.5L7.5 4.5v1.409l4.26 4.26"
      />
    ),
  },
  {
    title: 'Alertas automáticas',
    description: 'Notificaciones inmediatas ante fallas mecánicas o condiciones de riesgo.',
    icon: (
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0"
      />
    ),
  },
  {
    title: 'Mantenimiento preventivo',
    description: 'Calendario de mantenimientos por vehículo para anticiparte a las fallas.',
    icon: (
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M10.343 3.94c.09-.542.56-.94 1.11-.94h1.093c.55 0 1.02.398 1.11.94l.149.894c.07.424.384.764.78.93.398.164.855.142 1.205-.108l.737-.527a1.125 1.125 0 011.45.12l.773.774c.39.389.44 1.002.12 1.45l-.527.737c-.25.35-.272.806-.107 1.204.165.397.505.71.93.78l.893.15c.543.09.94.56.94 1.109v1.094c0 .55-.397 1.02-.94 1.11l-.893.149c-.425.07-.765.383-.93.78-.165.398-.143.854.107 1.204l.527.738c.32.447.269 1.06-.12 1.45l-.774.773a1.125 1.125 0 01-1.449.12l-.738-.527c-.35-.25-.806-.272-1.203-.107-.397.165-.71.505-.781.929l-.149.894c-.09.542-.56.94-1.11.94h-1.094c-.55 0-1.019-.398-1.11-.94l-.148-.894c-.071-.424-.384-.764-.781-.93-.398-.164-.854-.142-1.204.108l-.738.527c-.447.32-1.06.269-1.45-.12l-.773-.774a1.125 1.125 0 01-.12-1.45l.527-.737c.25-.35.273-.806.108-1.204-.165-.397-.505-.71-.93-.78l-.894-.15c-.542-.09-.94-.56-.94-1.109v-1.094c0-.55.398-1.02.94-1.11l.894-.149c.424-.07.765-.383.93-.78.165-.398.143-.854-.108-1.204l-.526-.738a1.125 1.125 0 01.12-1.45l.773-.773a1.125 1.125 0 011.45-.12l.737.527c.35.25.807.272 1.204.107.397-.165.71-.505.78-.929l.15-.894z M15 12a3 3 0 11-6 0 3 3 0 016 0z"
      />
    ),
  },
  {
    title: 'Gestión de conductores',
    description: 'Asigna conductores a cada vehículo y consulta su licencia y contacto en un solo lugar.',
    icon: (
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z"
      />
    ),
  },
  {
    title: 'Reportes de flota',
    description: 'Indicadores de consumo, disponibilidad y estado general de todos los vehículos.',
    icon: (
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z"
      />
    ),
  },
];

const HOW_IT_WORKS = [
  {
    step: '1',
    title: 'El camión reporta su estado',
    description: 'El GPS y el sistema OBD-II del vehículo envían posición, velocidad, RPM, temperatura y voltaje.',
  },
  {
    step: '2',
    title: 'FleetNova procesa la telemetría',
    description: 'El backend guarda cada lectura y genera alertas automáticas ante fallas o condiciones de riesgo.',
  },
  {
    step: '3',
    title: 'Tú lo ves al instante',
    description: 'El panel web y la app del conductor muestran la información actualizada, sin recargar nada.',
  },
];

// Opiniones ilustrativas: FleetNova es un proyecto académico sin clientes
// reales todavía, por lo que estas citas son ejemplos de uso (marcados como
// tal en la interfaz), no testimonios de clientes verdaderos.
const TESTIMONIALS = [
  {
    quote:
      'Antes revisábamos cada camión por radio. Ahora veo la ubicación y el estado del motor de toda la flota desde un solo panel.',
    role: 'Supervisor de flota',
    initials: 'SF',
  },
  {
    quote:
      'Las alertas automáticas avisan de una falla antes de que el conductor la note. Programamos el mantenimiento con tiempo, no cuando ya es tarde.',
    role: 'Coordinador de mantenimiento',
    initials: 'CM',
  },
  {
    quote:
      'Desde el celular veo mi vehículo asignado, sus mantenimientos y las alertas, sin tener que llamar a nadie para preguntar.',
    role: 'Conductor de carga pesada',
    initials: 'CD',
  },
];

const ROLES = [
  {
    name: 'Administrador / personal operativo',
    forWhom: 'Panel web',
    bullets: [
      'Gestiona vehículos, conductores y usuarios del sistema.',
      'Supervisa alertas y mantenimientos de toda la flota.',
      'Consulta reportes de consumo y disponibilidad.',
    ],
  },
  {
    name: 'Conductor',
    forWhom: 'App móvil',
    bullets: [
      'Consulta el vehículo que tiene asignado y su estado.',
      'Revisa los mantenimientos programados de su unidad.',
      'Recibe alertas y consulta su historial de recorridos.',
    ],
  },
];

function Logo({ dark = false }: { dark?: boolean }) {
  return (
    <a href="#top" className="flex items-center gap-2.5">
      <span className="relative flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-indigo-600 shadow-sm shadow-indigo-600/30">
        <svg className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 01-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 00-3.213-9.193 2.056 2.056 0 00-1.58-.86H14.25M16.5 18.75h-2.25m0-11.25h5.25M3 12h12.75" />
        </svg>
        <span className="absolute -right-0.5 -top-0.5 flex h-2.5 w-2.5">
          <span className="animate-ping-slow absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
          <span className={`relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-500 ring-2 ${dark ? 'ring-slate-900' : 'ring-white'}`} />
        </span>
      </span>
      <span className={`font-display text-lg font-extrabold tracking-tight ${dark ? 'text-white' : 'text-slate-900'}`}>
        Fleet<span className="text-indigo-600">Nova</span>
      </span>
    </a>
  );
}

function NavBar() {
  return (
    <header id="top" className="sticky top-0 z-50 border-b border-gray-200 bg-white/95 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 lg:px-8">
        <Logo />

        <nav className="hidden items-center gap-6 md:flex">
          {NAV_LINKS.map((link) => (
            <a key={link.href} href={link.href} className="text-sm font-medium text-gray-600 transition-colors hover:text-indigo-600">
              {link.label}
            </a>
          ))}
        </nav>

        <a href="#acceso" className="btn-primary">
          Iniciar sesión
        </a>
      </div>
    </header>
  );
}

export function Login() {
  const location = useLocation();
  const locationState = location.state as { from?: { pathname?: string }; error?: string } | null;
  const [serverError, setServerError] = useState<string | null>(locationState?.error ?? null);
  const [submitting, setSubmitting] = useState(false);
  const [redirecting, setRedirecting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginForm>();

  const from = locationState?.from?.pathname ?? '/';

  const onSubmit = async (data: LoginForm) => {
    setServerError(null);
    setSubmitting(true);
    try {
      const response = await api.post<LoginResponse>('/auth/login', {
        email: data.email,
        password: data.password,
      });
      const { token, user } = response.data;

      if (user.role === 'DRIVER') {
        // La app web es solo para personal administrativo. Como ya validamos
        // las credenciales aqui mismo, enviamos al conductor a la app móvil
        // con el token listo para usar, sin pedirle que inicie sesión otra vez.
        setRedirecting(true);
        const handoffUrl = `${MOBILE_APP_URL}/handoff?token=${encodeURIComponent(token)}`;
        window.location.href = handoffUrl;
        return;
      }

      setStoredAuth({ token, user });
      // Recarga completa para que el resto de la app (contexto de auth,
      // interceptores) arranque limpio con la sesión recién guardada.
      window.location.href = from;
    } catch (error) {
      setServerError(getApiErrorMessage(error, 'No se pudo iniciar sesión. Verifica tus credenciales.'));
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-white">
      <NavBar />
      <RotatingBanner />

      {/* Hero + acceso */}
      <section className="relative overflow-hidden bg-slate-900">
        <div
          className="pointer-events-none absolute -right-24 -top-24 h-80 w-80 rounded-full bg-indigo-600/20 blur-3xl sm:h-96 sm:w-96"
          aria-hidden="true"
        />
        <div
          className="pointer-events-none absolute -left-24 bottom-0 h-64 w-64 rounded-full bg-blue-600/10 blur-3xl sm:h-72 sm:w-72"
          aria-hidden="true"
        />
        <div className="relative mx-auto grid max-w-6xl gap-10 px-4 py-14 sm:py-20 lg:grid-cols-[1.15fr_0.85fr] lg:items-center lg:gap-16 lg:px-8">
          <div className="order-2 lg:order-1">
            <div className="mb-5 inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-medium tracking-wide text-indigo-200">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
              Gestión de flotas de carga pesada
            </div>

            <h1 className="text-4xl font-extrabold uppercase leading-[1.05] tracking-tight text-white sm:text-5xl">
              El control de tu flota, en un solo lugar
            </h1>
            <p className="mt-4 max-w-lg text-lg text-indigo-100/80">
              FleetNova combina GPS y diagnóstico OBD-II para que sepas dónde está cada camión, cómo está su
              motor y cuándo necesita atención, en tiempo real.
            </p>

            <div className="mt-6 flex flex-wrap gap-3">
              <a href="#acceso" className="btn-primary">
                Iniciar sesión
              </a>
              <a href="#caracteristicas" className="btn-secondary border-white/20 bg-transparent text-white hover:border-white/40 hover:bg-white/10">
                Ver características
              </a>
            </div>

            <div className="mt-10 grid grid-cols-1 gap-3 sm:grid-cols-3">
              {[
                { label: 'GPS en tiempo real', icon: 'M15 10.5a3 3 0 11-6 0 3 3 0 016 0z M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z' },
                { label: 'Diagnóstico OBD-II', icon: 'M11.42 15.17L17.25 21A2.652 2.652 0 0021 17.25l-5.877-5.877M11.42 15.17l2.496-3.03c.317-.384.74-.626 1.208-.766M11.42 15.17l-4.655 5.653a2.548 2.548 0 11-3.586-3.586l6.837-5.63' },
                { label: 'Alertas 24/7', icon: 'M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0' },
              ].map((fact) => (
                <div key={fact.label} className="flex items-center gap-2.5 rounded-lg border border-white/10 bg-white/5 px-3 py-2.5">
                  <svg className="h-4 w-4 flex-shrink-0 text-indigo-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d={fact.icon} />
                  </svg>
                  <span className="text-xs font-medium text-indigo-100">{fact.label}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="order-1 lg:order-2">
            <div id="acceso" className="mx-auto w-full max-w-sm scroll-mt-24 rounded-2xl bg-white p-8 shadow-2xl shadow-black/40">
              <div className="mb-6 text-center">
                <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-600">
                  <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 01-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 00-3.213-9.193 2.056 2.056 0 00-1.58-.86H14.25M16.5 18.75h-2.25m0-11.25h5.25M3 12h12.75" />
                  </svg>
                </div>
                <h2 className="text-xl font-bold text-gray-900">Iniciar sesión</h2>
                <p className="mt-1 text-sm text-gray-500">Con tu cuenta de administrador o de conductor</p>
              </div>

              <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
                <div>
                  <label htmlFor="email" className="mb-1 block text-sm font-medium text-gray-700">
                    Correo electrónico
                  </label>
                  <input
                    id="email"
                    type="email"
                    autoComplete="username"
                    className="field-input w-full"
                    {...register('email', {
                      required: 'El correo es obligatorio',
                      pattern: { value: /^\S+@\S+\.\S+$/, message: 'Correo inválido' },
                    })}
                  />
                  {errors.email && <p className="mt-1 text-xs text-red-600">{errors.email.message}</p>}
                </div>

                <div>
                  <label htmlFor="password" className="mb-1 block text-sm font-medium text-gray-700">
                    Contraseña
                  </label>
                  <input
                    id="password"
                    type="password"
                    autoComplete="current-password"
                    className="field-input w-full"
                    {...register('password', { required: 'La contraseña es obligatoria' })}
                  />
                  {errors.password && <p className="mt-1 text-xs text-red-600">{errors.password.message}</p>}
                </div>

                {serverError && (
                  <div className="rounded-md bg-red-50 p-2 text-sm text-red-700">{serverError}</div>
                )}

                <button type="submit" disabled={submitting} className="btn-primary w-full">
                  {redirecting ? 'Abriendo app del conductor...' : submitting ? 'Ingresando...' : 'Iniciar sesión'}
                </button>

                <p className="text-center text-xs text-gray-400">
                  Funciona tanto con credenciales de administrador como de conductor.
                </p>
              </form>
            </div>
          </div>
        </div>
      </section>

      {/* Características */}
      <section id="caracteristicas" className="scroll-mt-16 bg-white">
        <div className="mx-auto max-w-6xl px-4 py-16 lg:px-8">
          <div className="mb-10 max-w-xl">
            <p className="text-xs font-semibold uppercase tracking-wider text-indigo-600">Características</p>
            <h2 className="mt-2 text-3xl font-extrabold tracking-tight text-gray-900">
              Todo lo que necesitas para operar la flota
            </h2>
            <p className="mt-3 text-gray-600">Funcionalidades pensadas para el día a día de una operación de carga pesada.</p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map((feature) => (
              <div key={feature.title} className="card flex items-start gap-4 p-5">
                <div className="icon-badge">
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                    {feature.icon}
                  </svg>
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-900">{feature.title}</p>
                  <p className="mt-1 text-sm text-gray-600">{feature.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Cómo funciona */}
      <section id="como-funciona" className="scroll-mt-16 bg-gray-50">
        <div className="mx-auto max-w-6xl px-4 py-16 lg:px-8">
          <div className="mb-10 max-w-xl">
            <p className="text-xs font-semibold uppercase tracking-wider text-indigo-600">Cómo funciona</p>
            <h2 className="mt-2 text-3xl font-extrabold tracking-tight text-gray-900">
              Del camión a tu pantalla, sin pasos manuales
            </h2>
          </div>

          <div className="grid gap-6 md:grid-cols-3">
            {HOW_IT_WORKS.map((item, i) => (
              <div key={item.step} className="card relative p-6">
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-indigo-600 text-sm font-bold text-white">
                  {item.step}
                </span>
                <p className="mt-4 text-base font-semibold text-gray-900">{item.title}</p>
                <p className="mt-1.5 text-sm text-gray-600">{item.description}</p>
                {i < HOW_IT_WORKS.length - 1 && (
                  <svg
                    className="pointer-events-none absolute -right-4 top-1/2 hidden h-6 w-6 -translate-y-1/2 text-indigo-300 md:block"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                  </svg>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Mapa en vivo */}
      <section id="mapa" className="scroll-mt-16 bg-white">
        <div className="mx-auto max-w-6xl px-4 py-16 lg:px-8">
          <div className="mb-10 flex flex-wrap items-end justify-between gap-4">
            <div className="max-w-xl">
              <p className="text-xs font-semibold uppercase tracking-wider text-indigo-600">Mapa en vivo</p>
              <h2 className="mt-2 text-3xl font-extrabold tracking-tight text-gray-900">Así se ve en el mapa</h2>
              <p className="mt-3 text-gray-600">
                Uno de los vehículos de nuestra base de datos de demostración, con su posición actualizándose en
                vivo cada pocos segundos — igual que lo vería un administrador o un conductor en la plataforma.
              </p>
            </div>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping-slow absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
              </span>
              En vivo
            </span>
          </div>

          <LiveMapPreview />
        </div>
      </section>

      {/* Opiniones */}
      <section id="opiniones" className="scroll-mt-16 bg-slate-900">
        <div className="mx-auto max-w-6xl px-4 py-16 lg:px-8">
          <div className="mb-10 max-w-xl">
            <p className="text-xs font-semibold uppercase tracking-wider text-indigo-300">Opiniones</p>
            <h2 className="mt-2 text-3xl font-extrabold tracking-tight text-white">Así se vive usar FleetNova</h2>
            <p className="mt-3 text-indigo-100/70">
              Escenarios de ejemplo pensados para mostrar cómo se usaría la plataforma en el día a día — FleetNova
              es un proyecto académico y todavía no tiene clientes reales.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {TESTIMONIALS.map((testimonial) => (
              <div key={testimonial.role} className="relative rounded-xl bg-white p-5 shadow-lg shadow-black/20">
                <span className="absolute right-4 top-4 rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-gray-500">
                  Ejemplo
                </span>
                <svg className="h-6 w-6 text-indigo-200" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M7.17 6C4.86 8.11 3.5 10.85 3.5 13.9c0 3.06 2.15 5.1 4.62 5.1 2.24 0 3.88-1.72 3.88-3.85 0-2.02-1.42-3.6-3.3-3.6-.34 0-.7.06-.86.11.35-2.07 2.14-4.29 4-5.44L7.17 6zm10 0c-2.3 2.11-3.67 4.85-3.67 7.9 0 3.06 2.15 5.1 4.62 5.1 2.24 0 3.88-1.72 3.88-3.85 0-2.02-1.42-3.6-3.3-3.6-.34 0-.7.06-.86.11.35-2.07 2.14-4.29 4-5.44L17.17 6z" />
                </svg>
                <p className="mt-3 text-sm text-gray-700">{testimonial.quote}</p>
                <div className="mt-4 flex items-center gap-2.5 border-t border-gray-100 pt-4">
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-indigo-600 text-xs font-bold text-white">
                    {testimonial.initials}
                  </span>
                  <p className="text-xs font-medium text-gray-900">{testimonial.role}</p>
                </div>
              </div>
            ))}
          </div>
          <p className="mt-6 text-xs text-indigo-100/40">
            Testimonios de ejemplo, no de clientes reales — FleetNova es un proyecto académico.
          </p>
        </div>
      </section>

      {/* Actores */}
      <section id="actores" className="scroll-mt-16 bg-white">
        <div className="mx-auto max-w-6xl px-4 py-16 lg:px-8">
          <div className="mb-10 max-w-xl">
            <p className="text-xs font-semibold uppercase tracking-wider text-indigo-600">Actores del sistema</p>
            <h2 className="mt-2 text-3xl font-extrabold tracking-tight text-gray-900">Un acceso, dos experiencias</h2>
            <p className="mt-3 text-gray-600">La misma cuenta de acceso te lleva al panel correcto según tu rol.</p>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            {ROLES.map((role) => (
              <div key={role.name} className="card p-6">
                <span className="inline-flex items-center rounded-full bg-indigo-50 px-2.5 py-0.5 text-xs font-medium text-indigo-600">
                  {role.forWhom}
                </span>
                <p className="mt-3 text-lg font-semibold text-gray-900">{role.name}</p>
                <ul className="mt-3 space-y-2">
                  {role.bullets.map((bullet) => (
                    <li key={bullet} className="flex gap-2 text-sm text-gray-600">
                      <svg className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                      </svg>
                      {bullet}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA final */}
      <section className="bg-indigo-600">
        <div className="mx-auto max-w-4xl px-4 py-16 text-center lg:px-8">
          <h2 className="text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
            ¿Listo para monitorear tu flota?
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-indigo-100">
            Entra con tu cuenta de administrador o de conductor y compruébalo tú mismo, en vivo.
          </p>
          <a
            href="#acceso"
            className="mt-6 inline-flex items-center justify-center gap-1.5 rounded-lg bg-white px-6 py-3 text-base font-semibold text-indigo-600 shadow-sm transition-colors hover:bg-indigo-50"
          >
            Iniciar sesión
          </a>
        </div>
      </section>

      <footer className="border-t border-gray-200 bg-white">
        <div className="mx-auto flex max-w-6xl flex-col items-center gap-3 px-4 py-8 text-center lg:px-8">
          <Logo />
          <p className="text-xs text-gray-500">Gestión de flotas de carga pesada</p>
        </div>
      </footer>
    </div>
  );
}
