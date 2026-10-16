import type { ReactNode } from 'react';
import { getApiErrorMessage } from '../lib/api';

export function LoadingState({ label = 'Cargando...' }: { label?: string }) {
  return (
    <div className="flex items-center justify-center py-10 text-sm text-zinc-400">
      <svg className="mr-2 h-5 w-5 animate-spin text-brand-400" viewBox="0 0 24 24" fill="none">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
      </svg>
      {label}
    </div>
  );
}

export function ErrorState({ error, retry }: { error: unknown; retry?: () => void }) {
  return (
    <div className="rounded-xl border border-red-500/25 bg-red-500/10 p-4 text-sm text-red-300">
      <p className="font-medium">No se pudieron cargar los datos.</p>
      <p className="mt-1 text-red-400">{getApiErrorMessage(error)}</p>
      {retry && (
        <button
          type="button"
          onClick={retry}
          className="mt-3 rounded-lg bg-red-500/15 px-3 py-1.5 text-xs font-semibold text-red-200 active:bg-red-500/25"
        >
          Reintentar
        </button>
      )}
    </div>
  );
}

export function EmptyState({ children }: { children: ReactNode }) {
  return <div className="rounded-xl border border-dashed border-white/15 p-6 text-center text-sm text-zinc-400">{children}</div>;
}
