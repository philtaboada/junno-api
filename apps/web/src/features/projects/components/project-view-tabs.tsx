'use client';

import { CalendarDays, GanttChart, LayoutGrid, List } from 'lucide-react';
import { cn } from '@/lib/utils';

export type ProjectViewMode = 'list' | 'board' | 'calendar' | 'timeline';

type ProjectViewTabsProps = {
  activeView: ProjectViewMode;
  onViewChange: (view: ProjectViewMode) => void;
};

export function ProjectViewTabs({
  activeView,
  onViewChange,
}: ProjectViewTabsProps) {
  return (
    <div className="flex items-center gap-1 border-b border-border/80">
      <button
        type="button"
        aria-current={activeView === 'list' ? 'page' : undefined}
        className={cn(
          'inline-flex items-center gap-2 border-b-2 px-3 py-2 text-sm font-medium transition-colors',
          activeView === 'list'
            ? 'border-brand-indigo text-brand-indigo'
            : 'border-transparent text-muted-foreground hover:text-foreground',
        )}
        onClick={() => onViewChange('list')}
      >
        <List className="size-4" />
        Lista
      </button>
      <button
        type="button"
        aria-current={activeView === 'board' ? 'page' : undefined}
        className={cn(
          'inline-flex items-center gap-2 border-b-2 px-3 py-2 text-sm font-medium transition-colors',
          activeView === 'board'
            ? 'border-brand-indigo text-brand-indigo'
            : 'border-transparent text-muted-foreground hover:text-foreground',
        )}
        onClick={() => onViewChange('board')}
      >
        <LayoutGrid className="size-4" />
        Tablero
      </button>
      <button
        type="button"
        aria-current={activeView === 'calendar' ? 'page' : undefined}
        className={cn(
          'inline-flex items-center gap-2 border-b-2 px-3 py-2 text-sm font-medium transition-colors',
          activeView === 'calendar'
            ? 'border-brand-indigo text-brand-indigo'
            : 'border-transparent text-muted-foreground hover:text-foreground',
        )}
        onClick={() => onViewChange('calendar')}
      >
        <CalendarDays className="size-4" />
        Calendario
      </button>
      <button
        type="button"
        aria-current={activeView === 'timeline' ? 'page' : undefined}
        className={cn(
          'inline-flex items-center gap-2 border-b-2 px-3 py-2 text-sm font-medium transition-colors',
          activeView === 'timeline'
            ? 'border-brand-indigo text-brand-indigo'
            : 'border-transparent text-muted-foreground hover:text-foreground',
        )}
        onClick={() => onViewChange('timeline')}
      >
        <GanttChart className="size-4" />
        Timeline
      </button>
    </div>
  );
}
