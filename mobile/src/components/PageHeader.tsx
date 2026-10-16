import type { ReactNode } from 'react';

export function PageHeader({ title, subtitle, action }: { title: string; subtitle?: string; action?: ReactNode }) {
  return (
    <header className="sticky top-0 z-10 flex items-center justify-between gap-3 border-b border-white/5 bg-ink-950/85 px-5 py-4 backdrop-blur-md pt-[max(1rem,env(safe-area-inset-top))]">
      <div>
        {subtitle && <p className="eyebrow">{subtitle}</p>}
        <h1 className="mt-0.5 text-2xl font-black uppercase leading-tight tracking-tight text-white">{title}</h1>
      </div>
      {action}
    </header>
  );
}
