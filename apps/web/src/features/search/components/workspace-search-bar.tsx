'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  FolderKanban,
  Loader2,
  MessageSquare,
  Search,
  SquareCheckBig,
} from 'lucide-react';
import type { WorkspaceSearchResponseDto } from '@pm/contracts';
import { TaskDetailSheet } from '@/features/tasks/components/task-detail-sheet';
import { searchWorkspace } from '@/lib/api/search';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

type WorkspaceSearchBarProps = {
  className?: string;
  value?: string;
  onValueChange?: (value: string) => void;
  defaultQuery?: string;
  showFullResultsLink?: boolean;
};

export function WorkspaceSearchBar({
  className,
  value,
  onValueChange,
  defaultQuery = '',
  showFullResultsLink = true,
}: WorkspaceSearchBarProps) {
  const router = useRouter();
  const isControlled = value !== undefined;
  const [internalQuery, setInternalQuery] = useState(defaultQuery);
  const query = isControlled ? value : internalQuery;
  const [results, setResults] = useState<WorkspaceSearchResponseDto | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [isSheetOpen, setIsSheetOpen] = useState(false);

  function updateQuery(nextQuery: string): void {
    if (!isControlled) {
      setInternalQuery(nextQuery);
    }
    onValueChange?.(nextQuery);
  }

  const trimmedQuery = query.trim();
  const canSearch = trimmedQuery.length >= 2;

  useEffect(() => {
    if (!canSearch) {
      return;
    }
    const timeoutId = window.setTimeout(() => {
      setIsSearching(true);
      void searchWorkspace(trimmedQuery)
        .then((response) => {
          setResults(response);
        })
        .catch(() => {
          setResults(null);
        })
        .finally(() => {
          setIsSearching(false);
        });
    }, 300);
    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [canSearch, trimmedQuery]);

  const hasResults =
    results !== null &&
    (results.tasks.length > 0 ||
      results.projects.length > 0 ||
      results.comments.length > 0);
  const showDropdown = isFocused && canSearch;

  function openTask(taskId: string): void {
    setSelectedTaskId(taskId);
    setIsSheetOpen(true);
    setIsFocused(false);
  }

  return (
    <>
      <div className={cn('relative w-full max-w-md', className)}>
        <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={query}
          placeholder="Buscar tareas, proyectos…"
          className="h-9 pl-9"
          onFocus={() => setIsFocused(true)}
          onBlur={() => {
            window.setTimeout(() => setIsFocused(false), 150);
          }}
          onChange={(event) => updateQuery(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'Enter' && canSearch) {
              router.push(`/search?q=${encodeURIComponent(trimmedQuery)}`);
              setIsFocused(false);
            }
          }}
        />
        {showDropdown ? (
          <div className="absolute top-full right-0 left-0 z-50 mt-1 overflow-hidden rounded-xl border border-border/80 bg-popover shadow-lg">
            {isSearching ? (
              <div className="flex items-center gap-2 px-4 py-3 text-sm text-muted-foreground">
                <Loader2 className="size-4 animate-spin" />
                Buscando…
              </div>
            ) : hasResults ? (
              <div className="max-h-80 overflow-y-auto p-1">
                {results!.tasks.length > 0 ? (
                  <section className="p-1">
                    <p className="px-2 py-1 text-xs font-medium text-muted-foreground">
                      Tareas
                    </p>
                    {results!.tasks.map((task) => (
                      <button
                        key={task.id}
                        type="button"
                        className="flex w-full items-start gap-2 rounded-md px-2 py-2 text-left hover:bg-muted/60"
                        onMouseDown={() => openTask(task.id)}
                      >
                        <SquareCheckBig className="mt-0.5 size-4 shrink-0 text-brand-indigo" />
                        <span className="min-w-0">
                          <span className="block truncate text-sm">{task.name}</span>
                          <span className="block truncate text-xs text-muted-foreground">
                            {task.projectName}
                          </span>
                        </span>
                      </button>
                    ))}
                  </section>
                ) : null}
                {results!.projects.length > 0 ? (
                  <section className="p-1">
                    <p className="px-2 py-1 text-xs font-medium text-muted-foreground">
                      Proyectos
                    </p>
                    {results!.projects.map((project) => (
                      <Link
                        key={project.id}
                        href={`/projects/${project.id}`}
                        className="flex items-start gap-2 rounded-md px-2 py-2 hover:bg-muted/60"
                        onMouseDown={() => setIsFocused(false)}
                      >
                        <FolderKanban className="mt-0.5 size-4 shrink-0 text-brand-indigo" />
                        <span className="min-w-0">
                          <span className="block truncate text-sm">{project.name}</span>
                          <span className="block truncate text-xs text-muted-foreground">
                            {project.teamName}
                          </span>
                        </span>
                      </Link>
                    ))}
                  </section>
                ) : null}
                {results!.comments.length > 0 ? (
                  <section className="p-1">
                    <p className="px-2 py-1 text-xs font-medium text-muted-foreground">
                      Comentarios
                    </p>
                    {results!.comments.map((comment) => (
                      <button
                        key={comment.id}
                        type="button"
                        className="flex w-full items-start gap-2 rounded-md px-2 py-2 text-left hover:bg-muted/60"
                        onMouseDown={() => openTask(comment.taskId)}
                      >
                        <MessageSquare className="mt-0.5 size-4 shrink-0 text-brand-indigo" />
                        <span className="min-w-0">
                          <span className="block truncate text-sm">{comment.body}</span>
                          <span className="block truncate text-xs text-muted-foreground">
                            {comment.taskName} · {comment.projectName}
                          </span>
                        </span>
                      </button>
                    ))}
                  </section>
                ) : null}
              </div>
            ) : (
              <p className="px-4 py-3 text-sm text-muted-foreground">
                Sin resultados para «{trimmedQuery}».
              </p>
            )}
            {showFullResultsLink && canSearch ? (
              <div className="border-t border-border/70 p-2">
                <Link
                  href={`/search?q=${encodeURIComponent(trimmedQuery)}`}
                  className="block rounded-md px-2 py-2 text-sm text-brand-indigo hover:bg-muted/60"
                  onMouseDown={() => setIsFocused(false)}
                >
                  Ver todos los resultados
                </Link>
              </div>
            ) : null}
          </div>
        ) : null}
      </div>
      <TaskDetailSheet
        taskId={selectedTaskId}
        open={isSheetOpen}
        canEdit={false}
        canComment={false}
        onOpenChange={setIsSheetOpen}
        onTaskUpdated={() => undefined}
        onTaskDeleted={() => undefined}
      />
    </>
  );
}
