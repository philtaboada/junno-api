'use client';

import { useState } from 'react';
import { CalendarDays, CheckSquare, LayoutGrid, List } from 'lucide-react';
import { landingViews } from '@/features/landing/config/landing-content';
import { cn } from '@/lib/utils';

const viewIcons = {
  list: List,
  board: LayoutGrid,
  calendar: CalendarDays,
  'my-tasks': CheckSquare,
} as const;

function ViewIllustration({ viewId }: { viewId: string }) {
  if (viewId === 'board') {
    return (
      <div className="grid grid-cols-3 gap-3 p-6">
        {['Ideas', 'Doing', 'Done'].map((col, index) => (
          <div key={col} className="rounded-xl bg-muted/40 p-3">
            <p className="mb-2 text-xs font-medium text-muted-foreground">{col}</p>
            <div className="space-y-2">
              {Array.from({ length: 3 - index }).map((_, cardIndex) => (
                <div
                  key={`${col}-${cardIndex}`}
                  className="h-10 rounded-lg border border-border/60 bg-card"
                />
              ))}
            </div>
          </div>
        ))}
      </div>
    );
  }
  if (viewId === 'calendar') {
    return (
      <div className="grid grid-cols-7 gap-1 p-6">
        {Array.from({ length: 28 }).map((_, index) => (
          <div
            key={index}
            className={cn(
              'aspect-square rounded-md border border-border/40',
              index === 10 || index === 17 ? 'border-brand-coral/40 bg-brand-coral-muted/50' : 'bg-muted/20',
            )}
          />
        ))}
      </div>
    );
  }
  if (viewId === 'my-tasks') {
    return (
      <div className="space-y-4 p-6">
        {['Hoy', 'Próximas', 'Más tarde'].map((section, index) => (
          <div key={section}>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-brand-indigo">
              {section}
            </p>
            <div className="space-y-2">
              {Array.from({ length: 3 - index }).map((_, taskIndex) => (
                <div
                  key={`${section}-${taskIndex}`}
                  className="flex items-center gap-3 rounded-lg border border-border/60 bg-card px-3 py-2"
                >
                  <span className="size-4 rounded border border-border" />
                  <span className="h-2 flex-1 rounded bg-muted" />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    );
  }
  return (
    <div className="space-y-2 p-6">
      <div className="grid grid-cols-4 gap-2 border-b border-border/60 pb-3">
        {['Tarea', 'Asignado', 'Estado', 'Fecha'].map((col) => (
          <p key={col} className="text-[10px] font-medium uppercase text-muted-foreground">
            {col}
          </p>
        ))}
      </div>
      {Array.from({ length: 5 }).map((_, index) => (
        <div key={index} className="grid grid-cols-4 gap-2 py-2">
          <span className="h-2 rounded bg-muted" />
          <span className="h-2 rounded bg-muted/70" />
          <span className="h-2 rounded bg-brand-indigo-muted" />
          <span className="h-2 rounded bg-muted/70" />
        </div>
      ))}
    </div>
  );
}

export function LandingViews() {
  const [activeViewId, setActiveViewId] = useState(landingViews[0]?.id ?? 'list');
  const activeView = landingViews.find((view) => view.id === activeViewId) ?? landingViews[0];

  return (
    <section id="views" className="bg-muted/30 py-20 sm:py-28">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
          <div>
            <p className="text-sm font-medium uppercase tracking-widest text-brand-indigo">
              Vistas
            </p>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">
              Cambia de perspectiva sin cambiar de herramienta
            </h2>
            <p className="mt-4 text-lg text-muted-foreground">
              El mismo proyecto, múltiples formas de verlo. Cada miembro del equipo
              trabaja como prefiere.
            </p>
            <div className="mt-8 flex flex-wrap gap-2">
              {landingViews.map((view) => {
                const Icon = viewIcons[view.id as keyof typeof viewIcons];
                const isActive = view.id === activeViewId;
                return (
                  <button
                    key={view.id}
                    type="button"
                    onClick={() => setActiveViewId(view.id)}
                    className={cn(
                      'inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium transition-colors',
                      isActive
                        ? 'border-brand-indigo bg-brand-indigo text-white'
                        : 'border-border/80 bg-card text-muted-foreground hover:border-brand-indigo/30 hover:text-foreground',
                    )}
                  >
                    <Icon className="size-4" />
                    {view.label}
                  </button>
                );
              })}
            </div>
            <div className="mt-8">
              <h3 className="text-xl font-semibold tracking-tight">{activeView.headline}</h3>
              <p className="mt-2 text-muted-foreground">{activeView.description}</p>
            </div>
          </div>
          <div className="overflow-hidden rounded-2xl border border-border/80 bg-card shadow-none">
            <div className="border-b border-border/60 px-4 py-3">
              <p className="text-sm font-medium">Vista: {activeView.label}</p>
            </div>
            <ViewIllustration viewId={activeViewId} />
          </div>
        </div>
      </div>
    </section>
  );
}
