'use client';

import { useRef, useState } from 'react';
import type { CustomFieldDefinitionDto, ProjectListColumnDto } from '@pm/contracts';
import {
  buildListGridStyle,
  LIST_GRID_ROW_CLASSNAME,
  resolveVisibleListColumns,
  SUBTASK_INDENT_CLASSNAME,
  SUBTASK_LEADING_GRID_COLUMN,
} from '@/features/tasks/lib/list-column-registry';
import { cn } from '@/lib/utils';

type InlineAddSubtaskRowProps = {
  listColumns: ProjectListColumnDto[];
  customFields: CustomFieldDefinitionDto[];
  showTrailingActions?: boolean;
  onAdd: (name: string) => Promise<void>;
};

export function InlineAddSubtaskRow({
  listColumns,
  customFields,
  showTrailingActions = false,
  onAdd,
}: InlineAddSubtaskRowProps) {
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
    if (name.trim().length > 0) {
      void handleSubmit();
    }
  }

  return (
    <div
      className={cn(
        LIST_GRID_ROW_CLASSNAME,
        'border-b border-border/40 bg-muted/10 px-4 py-1 last:border-b-0',
      )}
      style={gridStyle}
    >
      <div className={SUBTASK_INDENT_CLASSNAME} style={{ gridColumn: SUBTASK_LEADING_GRID_COLUMN }}>
        <span
          aria-hidden
          className="size-4 shrink-0 rounded-full border border-dashed border-border/70"
        />
        <input
          ref={inputRef}
          type="text"
          value={name}
          placeholder="Añadir subtarea…"
          className="h-8 w-full min-w-0 flex-1 border-0 bg-transparent text-sm text-muted-foreground outline-none placeholder:text-muted-foreground/80 focus:ring-0"
          onChange={(event) => setName(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'Enter') {
              event.preventDefault();
              void handleSubmit();
            }
            if (event.key === 'Escape') {
              event.preventDefault();
              setName('');
              inputRef.current?.blur();
            }
          }}
          onBlur={handleBlur}
        />
      </div>
      {visibleColumns.map((column) => (
        <span key={column.id} aria-hidden className="min-h-8" />
      ))}
      {showTrailingActions ? <span aria-hidden className="size-7 shrink-0" /> : null}
    </div>
  );
}
