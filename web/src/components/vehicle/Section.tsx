import type { ReactNode } from 'react';

export function Section({ title, children, action }: { title: string; children: ReactNode; action?: ReactNode }) {
  return (
    <section className="card p-6">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-black uppercase tracking-tight text-white">{title}</h2>
        {action}
      </div>
      {children}
    </section>
  );
}
