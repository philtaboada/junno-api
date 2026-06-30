'use client';

import { useRef, useState } from 'react';
import type { ProjectListColumnDto } from '@pm/contracts';
import {
  buildListGridStyle,
  resolveVisibleListColumns,
  LIST_GRID_ROW_CLASSNAME,
} from '@/features/tasks/lib/list-column-registry';
import type { CustomFieldDefinitionDto } from '@pm/contracts';
import { cn } from '@/lib/utils';

type InlineAddTaskRowProps = {
  listColumns: ProjectListColumnDto[];
  customFields: CustomFieldDefinitionDto[];
  showTrailingActions?: boolean;
  onAdd: (name: string) => Promise<void>;
  onCancel: () => void;
};

export function InlineAddTaskRow({
  listColumns,
  customFields,
  showTrailingActions = false,
  onAdd,
  onCancel,
}: InlineAddTaskRowProps) {
  const [name, setName] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const isSubmittingRef = useRef(false);
  const visibleColumns = resolveVisibleListColumns(listColumns);
  const gridStyle = buildListGridStyle(listColumns, customFields, {
    showTrailingActions,
  });

  async function handleSubmit(): Promise<void> {
    const trimmedName = name.trim();
    if (trimmedName.length < 1) {
      onCancel();
      return;
    }
    if (isSubmittingRef.current) {
      return;
    }
    isSubmittingRef.current = true;
    setName('');
    try {
      await onAdd(trimmedName);
      inputRef.current?.focus();
    } finally {
      isSubmittingRef.current = false;
    }
  }

  function handleBlur(): void {
    const trimmedName = name.trim();
    if (trimmedName.length > 0) {
      void handleSubmit();
      return;
    }
    if (!isSubmittingRef.current) {
      onCancel();
    }
  }

  return (
    <div
      className={cn(LIST_GRID_ROW_CLASSNAME, 'border-t border-border/40 px-4 py-1.5')}
      style={gridStyle}
    >
      <span aria-hidden className="size-5 shrink-0" />
      <span
        aria-hidden
        className="my-auto size-4 rounded-full border border-dashed border-border/80"
      />
      <input
        ref={inputRef}
        type="text"
        value={name}
        autoFocus
        placeholder="Escribe el nombre de la tarea"
        className="h-9 w-full min-w-0 border-0 bg-transparent text-sm outline-none placeholder:text-muted-foreground focus:ring-0"
        onChange={(event) => setName(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === 'Enter') {
            event.preventDefault();
            void handleSubmit();
          }
          if (event.key === 'Escape') {
            event.preventDefault();
            onCancel();
          }
        }}
        onBlur={handleBlur}
      />
      {visibleColumns.map((column) => (
        <span key={column.id} aria-hidden className="min-h-8" />
      ))}
      {showTrailingActions ? <span aria-hidden className="size-7 shrink-0" /> : null}
    </div>
  );
}
