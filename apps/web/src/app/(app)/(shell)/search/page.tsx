'use client';

import { useSearchParams } from 'next/navigation';
import { SearchView } from '@/features/search/components/search-view';

export default function SearchPage() {
  const searchParams = useSearchParams();
  const initialQuery = searchParams.get('q') ?? '';

  return (
    <div className="flex flex-1 flex-col gap-6 p-6">
      <div>
        <p className="text-sm text-muted-foreground">Workspace</p>
        <h1 className="text-3xl font-semibold tracking-tight">Buscar</h1>
        <p className="mt-2 text-muted-foreground">
          Encuentra tareas, proyectos y comentarios en tu workspace.
        </p>
      </div>
      <SearchView key={initialQuery} initialQuery={initialQuery} />
    </div>
  );
}
