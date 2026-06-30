'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  FolderKanban,
  Loader2,
  MessageSquare,
  SquareCheckBig,
} from 'lucide-react';
import type { WorkspaceSearchResponseDto } from '@pm/contracts';
import { WorkspaceSearchBar } from '@/features/search/components/workspace-search-bar';
import { TaskDetailSheet } from '@/features/tasks/components/task-detail-sheet';
import { searchWorkspace } from '@/lib/api/search';
import { Alert, AlertDescription } from '@/components/ui/alert';

type SearchViewProps = {
  initialQuery: string;
};

export function SearchView({ initialQuery }: SearchViewProps) {
  const [query, setQuery] = useState(initialQuery);
  const [results, setResults] = useState<WorkspaceSearchResponseDto | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [isSheetOpen, setIsSheetOpen] = useState(false);

  const trimmedQuery = query.trim();
  const canSearch = trimmedQuery.length >= 2;

  useEffect(() => {
    if (!canSearch) {
      return;
    }
    const timeoutId = window.setTimeout(() => {
      setIsLoading(true);
      setLoadError(null);
      void searchWorkspace(trimmedQuery)
        .then((response) => {
          setResults(response);
        })
        .catch(() => {
          setLoadError('No se pudo completar la búsqueda');
          setResults(null);
        })
        .finally(() => {
          setIsLoading(false);
        });
    }, 250);
    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [canSearch, trimmedQuery]);

  function openTask(taskId: string): void {
    setSelectedTaskId(taskId);
    setIsSheetOpen(true);
  }

  return (
    <div className="flex flex-col gap-6">
      <WorkspaceSearchBar
        value={query}
        onValueChange={setQuery}
        showFullResultsLink={false}
        className="max-w-2xl"
      />
      {loadError ? (
        <Alert variant="destructive">
          <AlertDescription>{loadError}</AlertDescription>
        </Alert>
      ) : null}
      {!canSearch ? (
        <p className="text-sm text-muted-foreground">
          Escribe al menos 2 caracteres para buscar en el workspace.
        </p>
      ) : isLoading ? (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="size-4 animate-spin" />
          Buscando «{trimmedQuery}»…
        </div>
      ) : results ? (
        <div className="grid gap-8 lg:grid-cols-3">
          <SearchResultSection
            title="Tareas"
            emptyMessage="No hay tareas que coincidan."
            items={results.tasks.map((task) => ({
              key: task.id,
              primary: task.name,
              secondary: task.projectName,
              icon: <SquareCheckBig className="size-4 text-brand-indigo" />,
              onClick: () => openTask(task.id),
            }))}
          />
          <SearchResultSection
            title="Proyectos"
            emptyMessage="No hay proyectos que coincidan."
            items={results.projects.map((project) => ({
              key: project.id,
              primary: project.name,
              secondary: project.teamName,
              icon: <FolderKanban className="size-4 text-brand-indigo" />,
              href: `/projects/${project.id}`,
            }))}
          />
          <SearchResultSection
            title="Comentarios"
            emptyMessage="No hay comentarios que coincidan."
            items={results.comments.map((comment) => ({
              key: comment.id,
              primary: comment.body,
              secondary: `${comment.taskName} · ${comment.projectName}`,
              icon: <MessageSquare className="size-4 text-brand-indigo" />,
              onClick: () => openTask(comment.taskId),
            }))}
          />
        </div>
      ) : null}
      <TaskDetailSheet
        taskId={selectedTaskId}
        open={isSheetOpen}
        canEdit={false}
        canComment={false}
        onOpenChange={setIsSheetOpen}
        onTaskUpdated={() => undefined}
        onTaskDeleted={() => undefined}
      />
    </div>
  );
}

type SearchResultItem = {
  key: string;
  primary: string;
  secondary: string;
  icon: React.ReactNode;
  href?: string;
  onClick?: () => void;
};

type SearchResultSectionProps = {
  title: string;
  emptyMessage: string;
  items: SearchResultItem[];
};

function SearchResultSection({
  title,
  emptyMessage,
  items,
}: SearchResultSectionProps) {
  return (
    <section>
      <h2 className="mb-3 text-sm font-medium text-foreground">{title}</h2>
      {items.length === 0 ? (
        <p className="text-sm text-muted-foreground">{emptyMessage}</p>
      ) : (
        <ul className="flex flex-col gap-1">
          {items.map((item) => {
            const content = (
              <>
                {item.icon}
                <span className="min-w-0">
                  <span className="block truncate text-sm">{item.primary}</span>
                  <span className="block truncate text-xs text-muted-foreground">
                    {item.secondary}
                  </span>
                </span>
              </>
            );
            if (item.href) {
              return (
                <li key={item.key}>
                  <Link
                    href={item.href}
                    className="flex items-start gap-2 rounded-lg px-2 py-2 hover:bg-muted/50"
                  >
                    {content}
                  </Link>
                </li>
              );
            }
            return (
              <li key={item.key}>
                <button
                  type="button"
                  className="flex w-full items-start gap-2 rounded-lg px-2 py-2 text-left hover:bg-muted/50"
                  onClick={item.onClick}
                >
                  {content}
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
