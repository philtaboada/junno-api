type AppMarkProps = {
  className?: string;
  compact?: boolean;
};

export function AppMark({ className, compact = false }: AppMarkProps) {
  if (compact) {
    return (
      <div className={className}>
        <div className="flex items-center gap-2.5 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:gap-0">
          <div className="relative flex size-8 shrink-0 items-center justify-center">
            <span className="absolute size-8 rounded-lg bg-brand-indigo/15" />
            <span className="absolute size-4 translate-x-0.5 translate-y-0.5 rounded-sm bg-brand-coral" />
            <span className="relative size-4 -translate-x-0.5 -translate-y-0.5 rounded-sm bg-brand-indigo" />
          </div>
          <span className="truncate text-sm font-semibold tracking-tight group-data-[collapsible=icon]:hidden">
            Junno
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className={className}>
      <div className="flex items-center gap-3">
        <div className="relative flex size-9 items-center justify-center">
          <span className="absolute size-9 rounded-xl bg-brand-indigo/15" />
          <span className="absolute size-5 translate-x-1 translate-y-1 rounded-md bg-brand-coral" />
          <span className="relative size-5 -translate-x-1 -translate-y-1 rounded-md bg-brand-indigo" />
        </div>
        <div>
          <p className="text-base font-semibold tracking-tight text-foreground">
            Junno
          </p>
          <p className="text-xs text-muted-foreground">Gestiona con claridad</p>
        </div>
      </div>
    </div>
  );
}
