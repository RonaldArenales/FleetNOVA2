import { useState, type ReactNode } from 'react';
import { useForm } from 'react-hook-form';
import { useLocation } from 'react-router-dom';
import { api, getApiErrorMessage, setStoredAuth } from '../lib/api';
import type { LoginResponse } from '../types';
import { RotatingBanner } from '../components/landing/RotatingBanner';
import { LiveMapPreview } from '../components/landing/LiveMapPreview';
import { AccessRequestForm } from '../components/landing/AccessRequestForm';

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

const TRUCK_PATH =
  'M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 01-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 00-3.213-9.193 2.056 2.056 0 00-1.58-.86H14.25M16.5 18.75h-2.25m0-11.25h5.25M3 12h12.75';

// Datos del hero: capacidades reales de la plataforma, no métricas de negocio.
const HERO_STATS = [
  { value: 'GPS', label: 'Ubicación de cada camión en tiempo real' },
  { value: 'OBD-II', label: 'RPM, temperatura, batería y fallas del motor' },
  { value: '24/7', label: 'Alertas automáticas ante fallas o riesgos' },
];

function Logo() {
  return (
    <a href="#top" className="flex items-center gap-2.5">
      <span className="relative flex h-11 w-11 flex-shrink-0">
        <img src="/logo-mark.png" alt="" aria-hidden="true" className="h-11 w-11" />
        <span className="absolute -right-0.5 -top-0.5 flex h-2.5 w-2.5">
          <span className="animate-ping-slow absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
          <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-500 ring-2 ring-ink-950" />
        </span>
      </span>
      <span className="font-display text-lg font-black uppercase tracking-tight text-white">
        Fleet<span className="text-brand-400">Nova</span>
      </span>
    </a>
  );
}

function NavBar() {
  return (
    <header id="top" className="sticky top-0 z-50 border-b border-white/5 bg-ink-950/80 backdrop-blur-md">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 lg:px-8">
        <Logo />

        <nav className="hidden items-center gap-1 rounded-full border border-white/10 bg-white/[0.03] p-1 lg:flex">
          {NAV_LINKS.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="rounded-full px-4 py-1.5 text-sm font-medium text-zinc-300 transition-colors hover:bg-brand-400 hover:text-ink-950"
            >
              {link.label}
            </a>
          ))}
        </nav>

        <div className="flex items-center gap-2 sm:gap-3">
          <a href="#solicitar-acceso" className="btn-secondary hidden sm:inline-flex">
            Solicitar acceso
          </a>
          <a href="#acceso" className="btn-primary">
            Iniciar sesión
          </a>
        </div>
      </div>
    </header>
  );
}

function SectionHeading({
  eyebrow,
  children,
  description,
  center = false,
  light = false,
}: {
  eyebrow: string;
  children: ReactNode;
  description?: string;
  center?: boolean;
  light?: boolean;
}) {
  return (
    <div className={`mb-12 max-w-2xl ${center ? 'mx-auto text-center' : ''}`}>
      <p className={`text-xs font-semibold uppercase tracking-[0.2em] ${light ? 'text-brand-700' : 'text-brand-400'}`}>{eyebrow}</p>
      <h2
        className={`mt-3 text-3xl font-black uppercase leading-[1.05] tracking-tight sm:text-4xl ${light ? 'text-ink-950' : 'text-white'}`}
      >
        {children}
      </h2>
      {description && <p className={`mt-4 ${light ? 'text-zinc-600' : 'text-zinc-400'}`}>{description}</p>}
    </div>
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
    <div className="min-h-screen bg-ink-950">
      <NavBar />
      <RotatingBanner />

      {/* Hero + acceso */}
      <section className="relative overflow-hidden">
        <img
          src="/img/hero-night-highway.jpg"
          alt=""
          aria-hidden="true"
          className="absolute inset-0 h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-ink-950 via-ink-950/85 to-ink-950/30" aria-hidden="true" />
        <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-ink-950 to-transparent" aria-hidden="true" />

        <div className="relative mx-auto grid max-w-7xl gap-12 px-4 py-16 sm:py-24 lg:grid-cols-[1.2fr_0.8fr] lg:items-center lg:gap-16 lg:px-8">
          <div className="order-2 lg:order-1">
            <p className="eyebrow">Gestión de flotas de carga pesada</p>

            <h1 className="mt-4 text-5xl font-black uppercase leading-[0.95] tracking-tight text-white sm:text-6xl lg:text-7xl">
              El control de tu flota.
              <br />
              <span className="text-brand-400">En un solo lugar.</span>
            </h1>
            <p className="mt-6 max-w-lg text-lg text-zinc-300">
              FleetNova combina GPS y diagnóstico OBD-II para que sepas dónde está cada camión, cómo está su
              motor y cuándo necesita atención, en tiempo real.
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              <a href="#acceso" className="btn-primary px-6 py-3 text-base">
                Iniciar sesión →
              </a>
              <a href="#caracteristicas" className="btn-secondary px-6 py-3 text-base">
                Ver características
              </a>
            </div>

            <div className="mt-12 grid max-w-2xl grid-cols-1 gap-3 sm:grid-cols-3">
              {HERO_STATS.map((stat) => (
                <div key={stat.value} className="rounded-2xl border border-white/10 bg-ink-950/60 p-4 backdrop-blur">
                  <p className="font-display text-3xl font-black leading-none text-white">{stat.value}</p>
                  <p className="mt-2 text-xs leading-snug text-zinc-400">{stat.label}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="order-1 lg:order-2">
            <div
              id="acceso"
              className="mx-auto w-full max-w-sm scroll-mt-24 rounded-3xl border border-white/10 bg-ink-900/80 p-8 shadow-2xl shadow-black/60 backdrop-blur-xl"
            >
              <div className="mb-6">
                <img src="/logo-mark.png" alt="" aria-hidden="true" className="mb-4 h-16 w-16" />
                <h2 className="text-2xl font-black uppercase tracking-tight text-white">Iniciar sesión</h2>
                <p className="mt-1 text-sm text-zinc-400">Con tu cuenta de administrador o de conductor</p>
              </div>

              <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
                <div>
                  <label htmlFor="email" className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-zinc-400">
                    Correo electrónico
                  </label>
                  <input
                    id="email"
                    type="email"
                    autoComplete="username"
                    className="field-input w-full py-2.5"
                    {...register('email', {
                      required: 'El correo es obligatorio',
                      pattern: { value: /^\S+@\S+\.\S+$/, message: 'Correo inválido' },
                    })}
                  />
                  {errors.email && <p className="mt-1 text-xs text-red-400">{errors.email.message}</p>}
                </div>

                <div>
                  <label htmlFor="password" className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-zinc-400">
                    Contraseña
                  </label>
                  <input
                    id="password"
                    type="password"
                    autoComplete="current-password"
                    className="field-input w-full py-2.5"
                    {...register('password', { required: 'La contraseña es obligatoria' })}
                  />
                  {errors.password && <p className="mt-1 text-xs text-red-400">{errors.password.message}</p>}
                </div>

                {serverError && (
                  <div className="rounded-xl border border-red-500/25 bg-red-500/10 p-3 text-sm text-red-300">{serverError}</div>
                )}

                <button type="submit" disabled={submitting} className="btn-primary w-full py-3">
                  {redirecting ? 'Abriendo app del conductor...' : submitting ? 'Ingresando...' : 'Iniciar sesión'}
                </button>

                <p className="text-center text-xs text-zinc-500">
                  Funciona tanto con credenciales de administrador como de conductor.
                </p>
              </form>
            </div>
          </div>
        </div>
      </section>

      {/* Características */}
      <section id="caracteristicas" className="scroll-mt-16 bg-ink-950">
        <div className="mx-auto max-w-7xl px-4 py-20 lg:px-8">
          <SectionHeading
            eyebrow="Características"
            center
            description="Funcionalidades pensadas para el día a día de una operación de carga pesada."
          >
            Mueve tu operación <span className="tag-highlight">hacia</span> el futuro
          </SectionHeading>

          <div className="mb-4 grid gap-4 lg:grid-cols-3">
            <div className="relative min-h-[260px] overflow-hidden rounded-3xl border border-white/5">
              <img src="/img/warehouse.jpg" alt="" aria-hidden="true" className="absolute inset-0 h-full w-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-ink-950 via-ink-950/40 to-transparent" />
              <p className="absolute inset-x-5 bottom-5 text-sm font-medium text-zinc-200">
                Del patio de carga a la carretera, cada unidad registrada y monitoreada.
              </p>
            </div>

            <div className="flex flex-col justify-between rounded-3xl border border-white/5 bg-ink-900 p-7">
              <div>
                <div className="icon-badge">
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                    <path strokeLinecap="round" strokeLinejoin="round" d={TRUCK_PATH} />
                  </svg>
                </div>
                <h3 className="mt-5 text-2xl font-black uppercase leading-tight tracking-tight text-white">
                  Logística que te mantiene <span className="text-brand-400">adelante</span>
                </h3>
                <p className="mt-3 text-sm text-zinc-400">
                  Telemetría, alertas y mantenimiento en una sola plataforma, para decidir con datos y no por radio.
                </p>
              </div>
              <a href="#como-funciona" className="link-action mt-6 text-sm">
                Cómo funciona →
              </a>
            </div>

            <div className="relative min-h-[260px] overflow-hidden rounded-3xl border border-white/5">
              <img src="/img/fog-truck.jpg" alt="" aria-hidden="true" className="absolute inset-0 h-full w-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-ink-950 via-ink-950/30 to-transparent" />
              <a href="#mapa" className="btn-secondary absolute bottom-5 left-5 border-white/20 bg-ink-950/60 backdrop-blur">
                Ver mapa en vivo →
              </a>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map((feature) => (
              <div
                key={feature.title}
                className="group rounded-3xl border border-white/5 bg-ink-900 p-6 transition-colors hover:border-brand-400/30"
              >
                <div className="icon-badge transition-colors group-hover:bg-brand-400 group-hover:text-ink-950">
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                    {feature.icon}
                  </svg>
                </div>
                <p className="mt-5 text-base font-bold text-white">{feature.title}</p>
                <p className="mt-1.5 text-sm text-zinc-400">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Cómo funciona: franja clara con tarjetas oscuras, como en el diseño de referencia */}
      <section id="como-funciona" className="scroll-mt-16 bg-zinc-100">
        <div className="mx-auto max-w-7xl px-4 py-20 lg:px-8">
          <div className="grid gap-8 lg:grid-cols-2 lg:items-end">
            <SectionHeading eyebrow="Cómo funciona" light>
              Del camión a tu pantalla, sin pasos manuales
            </SectionHeading>
            <p className="mb-12 max-w-md text-zinc-600 lg:justify-self-end">
              La telemetría viaja sola desde el vehículo hasta el panel web y la app del conductor. Nadie tiene que
              cargar datos a mano.
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            {HOW_IT_WORKS.map((item) => (
              <div key={item.step} className="relative overflow-hidden rounded-3xl bg-ink-950 p-7 text-white shadow-xl shadow-black/10">
                <span className="tag-highlight py-0.5 text-xs font-bold uppercase tracking-wider">Paso {item.step}</span>
                <p className="mt-6 text-xl font-black uppercase leading-tight tracking-tight">{item.title}</p>
                <p className="mt-3 text-sm text-zinc-400">{item.description}</p>
                <span
                  className="pointer-events-none absolute -bottom-6 -right-2 font-display text-[9rem] font-black leading-none text-white/[0.04]"
                  aria-hidden="true"
                >
                  {item.step}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Mapa en vivo */}
      <section id="mapa" className="scroll-mt-16 bg-ink-950">
        <div className="mx-auto max-w-7xl px-4 py-20 lg:px-8">
          <div className="mb-10 flex flex-wrap items-end justify-between gap-4">
            <SectionHeading
              eyebrow="Mapa en vivo"
              description="Uno de los vehículos de nuestra base de datos de demostración, con su posición actualizándose en vivo cada pocos segundos — igual que lo vería un administrador o un conductor en la plataforma."
            >
              Así se ve en el mapa
            </SectionHeading>
            <span className="mb-12 inline-flex items-center gap-2 rounded-full border border-emerald-500/25 bg-emerald-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-emerald-300">
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
      <section id="opiniones" className="scroll-mt-16 border-y border-white/5 bg-ink-900">
        <div className="mx-auto max-w-7xl px-4 py-20 lg:px-8">
          <SectionHeading
            eyebrow="Opiniones"
            description="Escenarios de ejemplo pensados para mostrar cómo se usaría la plataforma en el día a día — FleetNova es un proyecto académico y todavía no tiene clientes reales."
          >
            Así se vive usar <span className="text-brand-400">FleetNova</span>
          </SectionHeading>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {TESTIMONIALS.map((testimonial) => (
              <div key={testimonial.role} className="relative flex flex-col rounded-3xl border border-white/5 bg-ink-950 p-6">
                <span className="absolute right-5 top-5 rounded-full border border-white/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-zinc-500">
                  Ejemplo
                </span>
                <svg className="h-7 w-7 text-brand-400" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M7.17 6C4.86 8.11 3.5 10.85 3.5 13.9c0 3.06 2.15 5.1 4.62 5.1 2.24 0 3.88-1.72 3.88-3.85 0-2.02-1.42-3.6-3.3-3.6-.34 0-.7.06-.86.11.35-2.07 2.14-4.29 4-5.44L7.17 6zm10 0c-2.3 2.11-3.67 4.85-3.67 7.9 0 3.06 2.15 5.1 4.62 5.1 2.24 0 3.88-1.72 3.88-3.85 0-2.02-1.42-3.6-3.3-3.6-.34 0-.7.06-.86.11.35-2.07 2.14-4.29 4-5.44L17.17 6z" />
                </svg>
                <p className="mt-4 flex-1 text-sm leading-relaxed text-zinc-300">{testimonial.quote}</p>
                <div className="mt-6 flex items-center gap-3 border-t border-white/5 pt-5">
                  <span className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-400 text-xs font-bold text-ink-950">
                    {testimonial.initials}
                  </span>
                  <p className="text-sm font-semibold text-white">{testimonial.role}</p>
                </div>
              </div>
            ))}
          </div>
          <p className="mt-6 text-xs text-zinc-600">
            Testimonios de ejemplo, no de clientes reales — FleetNova es un proyecto académico.
          </p>
        </div>
      </section>

      {/* Actores */}
      <section id="actores" className="scroll-mt-16 bg-ink-950">
        <div className="mx-auto max-w-7xl px-4 py-20 lg:px-8">
          <SectionHeading eyebrow="Actores del sistema" description="La misma cuenta de acceso te lleva al panel correcto según tu rol.">
            Un acceso, <span className="text-brand-400">dos experiencias</span>
          </SectionHeading>

          <div className="grid gap-4 md:grid-cols-2">
            {ROLES.map((role) => (
              <div key={role.name} className="rounded-3xl border border-white/5 bg-ink-900 p-7">
                <span className="tag-highlight py-0.5 text-xs font-bold uppercase tracking-wider">{role.forWhom}</span>
                <p className="mt-4 text-xl font-black uppercase tracking-tight text-white">{role.name}</p>
                <ul className="mt-4 space-y-3">
                  {role.bullets.map((bullet) => (
                    <li key={bullet} className="flex gap-3 text-sm text-zinc-300">
                      <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-brand-400/15 text-brand-400">
                        <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                        </svg>
                      </span>
                      {bullet}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Solicitar acceso */}
      <section id="solicitar-acceso" className="scroll-mt-16 border-t border-white/5 bg-ink-900">
        <div className="mx-auto max-w-7xl px-4 py-20 lg:px-8">
          <div className="grid gap-10 lg:grid-cols-2 lg:items-start">
            <SectionHeading
              eyebrow="Solicitar acceso"
              description="Cuéntanos quién eres y nuestro equipo se pondrá en contacto para darte acceso a la plataforma, ya sea como administrador o como conductor."
            >
              ¿Aún no tienes <span className="text-brand-400">cuenta?</span>
            </SectionHeading>
            <AccessRequestForm />
          </div>
        </div>
      </section>

      {/* CTA final */}
      <section className="relative overflow-hidden">
        <img src="/img/sunset-convoy.jpg" alt="" aria-hidden="true" className="absolute inset-0 h-full w-full object-cover" />
        <div className="absolute inset-0 bg-ink-950/75" aria-hidden="true" />
        <div className="relative mx-auto max-w-4xl px-4 py-24 text-center lg:px-8">
          <h2 className="text-4xl font-black uppercase leading-[1] tracking-tight text-white sm:text-5xl">
            ¿Listo para <span className="text-brand-400">monitorear</span> tu flota?
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-zinc-300">
            Entra con tu cuenta de administrador o de conductor y compruébalo tú mismo, en vivo.
          </p>
          <a href="#acceso" className="btn-primary mt-8 px-8 py-3 text-base">
            Iniciar sesión →
          </a>
        </div>
      </section>

      <footer className="border-t border-white/5 bg-ink-950">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-4 py-8 sm:flex-row lg:px-8">
          <Logo />
          <p className="text-xs text-zinc-500">Gestión de flotas de carga pesada · Fotos: Unsplash</p>
        </div>
      </footer>
    </div>
  );
}
