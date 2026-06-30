import type { LucideIcon } from 'lucide-react';
import {
  Bell,
  CheckSquare,
  FolderKanban,
  Home,
  Inbox,
  LayoutGrid,
  Users,
} from 'lucide-react';

type PreviewNavItem = {
  readonly icon: LucideIcon;
  readonly label: string;
  readonly active?: boolean;
  readonly badge?: number;
};

const boardColumns = [
  {
    title: 'Por hacer',
    cards: [
      { title: 'Diseño del onboarding', tag: 'Producto', color: 'bg-brand-indigo' },
      { title: 'Revisar copy landing', tag: 'Marketing', color: 'bg-brand-coral' },
    ],
  },
  {
    title: 'En progreso',
    cards: [
      { title: 'API de notificaciones', tag: 'Backend', color: 'bg-brand-indigo' },
    ],
  },
  {
    title: 'Hecho',
    cards: [
      { title: 'Auth multitenancy', tag: 'Core', color: 'bg-emerald-500' },
      { title: 'Vista tablero', tag: 'Frontend', color: 'bg-brand-coral' },
    ],
  },
] as const;

const navItems: readonly PreviewNavItem[] = [
  { icon: Home, label: 'Inicio' },
  { icon: LayoutGrid, label: 'Dashboard' },
  { icon: Users, label: 'Equipos' },
  { icon: CheckSquare, label: 'Mis tareas', active: true },
  { icon: Inbox, label: 'Bandeja', badge: 3 },
  { icon: FolderKanban, label: 'Proyectos' },
];

export function LandingProductPreview() {
  return (
    <div className="landing-preview-shadow mx-auto max-w-5xl rounded-2xl border border-border/80 bg-card p-2 sm:rounded-3xl sm:p-3">
      <div className="overflow-hidden rounded-xl border border-border/60 bg-background sm:rounded-2xl">
        <div className="flex items-center gap-2 border-b border-border/60 bg-muted/40 px-4 py-3">
          <span className="size-2.5 rounded-full bg-red-400/80" />
          <span className="size-2.5 rounded-full bg-amber-400/80" />
          <span className="size-2.5 rounded-full bg-emerald-400/80" />
          <span className="ml-3 text-xs text-muted-foreground">junno.online — Q2 Launch</span>
        </div>
        <div className="flex min-h-[320px] sm:min-h-[380px]">
          <aside className="hidden w-52 shrink-0 border-r border-border/60 bg-sidebar p-3 sm:block">
            <div className="mb-4 flex items-center gap-2 px-2">
              <div className="relative flex size-7 items-center justify-center">
                <span className="absolute size-7 rounded-lg bg-brand-indigo/15" />
                <span className="absolute size-3.5 translate-x-0.5 translate-y-0.5 rounded-sm bg-brand-coral" />
                <span className="relative size-3.5 -translate-x-0.5 -translate-y-0.5 rounded-sm bg-brand-indigo" />
              </div>
              <span className="text-sm font-semibold">Junno</span>
            </div>
            <div className="mb-4 rounded-lg border border-border/60 bg-background px-3 py-2 text-xs font-medium">
              Acme Workspace
            </div>
            <nav className="space-y-1">
              {navItems.map((item) => (
                <div
                  key={item.label}
                  className={`flex items-center gap-2 rounded-lg px-2 py-1.5 text-xs ${
                    item.active
                      ? 'bg-brand-indigo-muted font-medium text-brand-indigo'
                      : 'text-muted-foreground'
                  }`}
                >
                  <item.icon className="size-3.5 shrink-0" />
                  <span className="flex-1 truncate">{item.label}</span>
                  {'badge' in item && item.badge !== undefined ? (
                    <span className="rounded-full bg-brand-coral px-1.5 py-0.5 text-[10px] font-semibold text-white">
                      {item.badge}
                    </span>
                  ) : null}
                </div>
              ))}
            </nav>
          </aside>
          <div className="flex min-w-0 flex-1 flex-col">
            <div className="flex items-center justify-between border-b border-border/60 px-4 py-3 sm:px-5">
              <div>
                <p className="text-xs text-muted-foreground">Proyecto</p>
                <p className="text-sm font-semibold sm:text-base">Q2 Launch</p>
              </div>
              <div className="flex items-center gap-2">
                <span className="hidden rounded-lg bg-brand-indigo-muted px-2.5 py-1 text-xs font-medium text-brand-indigo sm:inline">
                  Tablero
                </span>
                <span className="rounded-lg px-2.5 py-1 text-xs text-muted-foreground">
                  Lista
                </span>
                <span className="rounded-lg px-2.5 py-1 text-xs text-muted-foreground">
                  Calendario
                </span>
              </div>
            </div>
            <div className="grid flex-1 gap-3 overflow-x-auto p-3 sm:grid-cols-3 sm:p-4">
              {boardColumns.map((column) => (
                <div key={column.title} className="min-w-[140px] rounded-xl bg-muted/30 p-2.5">
                  <p className="mb-2 px-1 text-xs font-medium text-muted-foreground">
                    {column.title}
                  </p>
                  <div className="space-y-2">
                    {column.cards.map((card) => (
                      <div
                        key={card.title}
                        className="rounded-lg border border-border/60 bg-card p-2.5 shadow-none"
                      >
                        <p className="text-xs font-medium leading-snug sm:text-sm">
                          {card.title}
                        </p>
                        <span
                          className={`mt-2 inline-block rounded px-1.5 py-0.5 text-[10px] font-medium text-white ${card.color}`}
                        >
                          {card.tag}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
          <aside className="hidden w-56 shrink-0 border-l border-border/60 bg-card/50 p-4 lg:block">
            <p className="text-xs font-medium text-muted-foreground">Detalle de tarea</p>
            <p className="mt-2 text-sm font-semibold">API de notificaciones</p>
            <div className="mt-4 space-y-3">
              <div className="rounded-lg bg-muted/50 p-2.5">
                <p className="text-[10px] uppercase tracking-wide text-muted-foreground">
                  Asignado
                </p>
                <p className="mt-1 text-xs font-medium">María G.</p>
              </div>
              <div className="rounded-lg bg-muted/50 p-2.5">
                <p className="text-[10px] uppercase tracking-wide text-muted-foreground">
                  Fecha límite
                </p>
                <p className="mt-1 text-xs font-medium">Viernes</p>
              </div>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Bell className="size-3.5 text-brand-indigo" />
                2 comentarios nuevos
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
