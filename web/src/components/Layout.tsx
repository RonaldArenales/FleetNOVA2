import { useState } from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { useAuth } from '../lib/auth';

const TRUCK_PATH =
  'M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 01-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 00-3.213-9.193 2.056 2.056 0 00-1.58-.86H14.25M16.5 18.75h-2.25m0-11.25h5.25M3 12h12.75';

const navItems = [
  {
    to: '/',
    label: 'Dashboard',
    end: true,
    icon: 'M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75',
  },
  { to: '/vehiculos', label: 'Vehículos', icon: TRUCK_PATH },
  {
    to: '/conductores',
    label: 'Conductores',
    icon: 'M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z',
  },
  {
    to: '/alertas',
    label: 'Alertas',
    icon: 'M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0',
  },
  {
    to: '/reportes',
    label: 'Reportes',
    icon: 'M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z',
  },
  // Datos de contacto de terceros (solicitudes) y gestion de cuentas
  // (usuarios): visibles solo para ADMIN, ver tambien accessRequests.routes.ts
  // y users.routes.ts en el backend, que ya exigen ese rol.
  {
    to: '/solicitudes',
    label: 'Solicitudes',
    adminOnly: true,
    icon: 'M18 7.5v3m0 0v3m0-3h3m-3 0h-3m-2.25-4.125a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zM3 19.235v-.11a6.375 6.375 0 0112.75 0v.109A12.318 12.318 0 019.374 21c-2.331 0-4.512-.645-6.374-1.766z',
  },
  {
    to: '/usuarios',
    label: 'Usuarios',
    adminOnly: true,
    icon: 'M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z',
  },
];

const roleLabels: Record<string, string> = {
  ADMIN: 'Administrador',
  OPERATOR: 'Operador',
  VIEWER: 'Observador',
};

export function Layout() {
  const { user, logout } = useAuth();
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  return (
    <div className="flex min-h-screen bg-ink-950">
      {mobileNavOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm md:hidden"
          onClick={() => setMobileNavOpen(false)}
          aria-hidden="true"
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-64 flex-shrink-0 transform flex-col border-r border-white/5 bg-ink-950 text-zinc-100 transition-transform duration-200 ease-in-out md:sticky md:top-0 md:z-auto md:h-screen md:translate-x-0 ${
          mobileNavOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex items-center gap-3 px-6 py-6">
          <img src="/logo-mark.png" alt="" aria-hidden="true" className="h-12 w-12 flex-shrink-0" />
          <div>
            <span className="font-display text-lg font-black uppercase leading-none tracking-tight text-white">
              Fleet<span className="text-brand-400">Nova</span>
            </span>
            <p className="mt-1 text-[10px] font-medium uppercase leading-none tracking-[0.2em] text-zinc-500">Gestión de flotas</p>
          </div>
        </div>

        <p className="px-6 pb-2 pt-4 text-[10px] font-semibold uppercase tracking-[0.2em] text-zinc-600">Menú</p>
        <nav className="flex flex-1 flex-col gap-1 px-3">
          {navItems
            .filter((item) => !item.adminOnly || user?.role === 'ADMIN')
            .map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                onClick={() => setMobileNavOpen(false)}
                className={({ isActive }) =>
                  `flex items-center gap-3 rounded-full px-4 py-2.5 text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-brand-400 font-semibold text-ink-950 shadow-lg shadow-brand-400/10'
                      : 'text-zinc-400 hover:bg-white/5 hover:text-white'
                  }`
                }
              >
                <svg className="h-[18px] w-[18px] flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                  <path strokeLinecap="round" strokeLinejoin="round" d={item.icon} />
                </svg>
                {item.label}
              </NavLink>
            ))}
        </nav>

        <div className="m-3 overflow-hidden rounded-2xl border border-white/5 bg-[url('/img/sunset-convoy.jpg')] bg-cover bg-center">
          <div className="bg-gradient-to-t from-ink-950 via-ink-950/80 to-ink-950/30 p-4 pt-10">
            <p className="font-display text-sm font-black uppercase leading-tight text-white">
              Tu flota, <span className="text-brand-400">en tiempo real</span>
            </p>
            <p className="mt-1 text-[11px] text-zinc-400">FleetNova © 2026</p>
          </div>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex flex-wrap items-center justify-between gap-2 border-b border-white/5 bg-ink-950/80 px-4 py-3 backdrop-blur-md sm:px-8">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setMobileNavOpen(true)}
              className="rounded-full p-2 text-zinc-400 hover:bg-white/5 hover:text-white md:hidden"
              aria-label="Abrir menú"
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            <div className="hidden items-center gap-2 text-sm text-zinc-400 sm:flex">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping-slow absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
              </span>
              Plataforma de monitoreo de carga pesada
            </div>
          </div>
          <div className="flex items-center gap-3 sm:gap-4">
            {user && (
              <div className="flex items-center gap-2.5 rounded-full border border-white/10 bg-white/[0.03] py-1 pl-1 pr-4">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-400 text-xs font-bold text-ink-950">
                  {user.name.charAt(0).toUpperCase()}
                </div>
                <div className="text-left">
                  <p className="text-sm font-medium leading-tight text-white">{user.name}</p>
                  <p className="text-[11px] leading-tight text-zinc-500">{roleLabels[user.role] ?? user.role}</p>
                </div>
              </div>
            )}
            <button type="button" onClick={logout} className="btn-secondary py-1.5">
              Cerrar sesión
            </button>
          </div>
        </header>
        <main className="flex-1 overflow-y-auto p-4 sm:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
