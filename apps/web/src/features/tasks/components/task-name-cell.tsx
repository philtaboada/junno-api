'use client';

import { useEffect, useRef, useState } from 'react';
import { PanelRightOpen } from 'lucide-react';
import { cn } from '@/lib/utils';

type TaskNameCellProps = {
  name: string;
  isCompleted: boolean;
  canEdit: boolean;
  tone?: 'default' | 'subtask';
  onNameChange: (name: string) => Promise<void>;
  onOpen: () => void;
};

const SINGLE_CLICK_DELAY_MS = 220;

export function TaskNameCell({
  name,
  isCompleted,
  canEdit,
  tone = 'default',
  onNameChange,
  onOpen,
}: TaskNameCellProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [draft, setDraft] = useState(name);
  const [isSaving, setIsSaving] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const singleClickTimeoutRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (singleClickTimeoutRef.current !== null) {
        window.clearTimeout(singleClickTimeoutRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (!isEditing) {
      setDraft(name);
    }
  }, [name, isEditing]);

  function clearSingleClickTimeout(): void {
    if (singleClickTimeoutRef.current !== null) {
      window.clearTimeout(singleClickTimeoutRef.current);
      singleClickTimeoutRef.current = null;
    }
  }

  function startEditing(): void {
    if (!canEdit) {
      onOpen();
      return;
    }
    setDraft(name);
    setIsEditing(true);
    requestAnimationFrame(() => {
      inputRef.current?.focus();
      inputRef.current?.select();
    });
  }

  async function handleSave(): Promise<void> {
    const trimmedName = draft.trim();
    if (trimmedName.length < 1) {
      setDraft(name);
      setIsEditing(false);
      return;
    }
    if (trimmedName === name) {
      setIsEditing(false);
      return;
    }
    setIsSaving(true);
    try {
      await onNameChange(trimmedName);
      setIsEditing(false);
    } finally {
      setIsSaving(false);
    }
  }

  async function handleOpenDetail(): Promise<void> {
    clearSingleClickTimeout();
    if (isEditing) {
      await handleSave();
    }
    onOpen();
  }

  function handleNameClick(): void {
    if (!canEdit) {
      onOpen();
      return;
    }
    clearSingleClickTimeout();
    singleClickTimeoutRef.current = window.setTimeout(() => {
      startEditing();
      singleClickTimeoutRef.current = null;
    }, SINGLE_CLICK_DELAY_MS);
  }

  function handleNameDoubleClick(event: React.MouseEvent): void {
    event.preventDefault();
    clearSingleClickTimeout();
    void handleOpenDetail();
  }

  return (
    <div className="flex min-w-0 items-center gap-1 overflow-hidden">
      <div className="min-w-0 flex-1 overflow-hidden">
        {isEditing ? (
          <input
            ref={inputRef}
            type="text"
            value={draft}
            disabled={isSaving}
            className="h-9 w-full min-w-0 max-w-full overflow-hidden rounded-md border border-border/80 bg-background px-2 text-sm outline-none focus:ring-1 focus:ring-brand-indigo/40"
            onChange={(event) => setDraft(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter') {
                event.preventDefault();
                void handleSave();
              }
              if (event.key === 'Escape') {
                event.preventDefault();
                setDraft(name);
                setIsEditing(false);
              }
            }}
            onBlur={() => {
              void handleSave();
            }}
            onDoubleClick={handleNameDoubleClick}
          />
        ) : (
          <button
            type="button"
            className={cn(
              'block w-full min-w-0 max-w-full truncate overflow-hidden rounded-md px-1 text-left text-sm transition-colors',
              isCompleted && 'text-muted-foreground line-through',
              !isCompleted && tone === 'subtask' && 'text-muted-foreground',
              !isCompleted && tone === 'default' && 'hover:bg-muted/70 hover:text-brand-indigo',
              canEdit && 'cursor-text',
            )}
            onClick={handleNameClick}
            onDoubleClick={handleNameDoubleClick}
            title={
              canEdit
                ? `${name} — Clic para editar · Doble clic para abrir detalle`
                : `${name} — Abrir detalle`
            }
          >
            {name}
          </button>
        )}
      </div>
      <button
        type="button"
        className={cn(
          'inline-flex size-7 shrink-0 items-center justify-center rounded-md text-muted-foreground transition-opacity hover:bg-brand-indigo-muted hover:text-brand-indigo',
          isEditing ? 'opacity-100' : 'opacity-0 group-hover:opacity-100',
        )}
        aria-label="Abrir panel de detalle"
        title="Abrir panel de detalle"
        onMouseDown={(event) => {
          event.preventDefault();
        }}
        onClick={() => {
          void handleOpenDetail();
        }}
      >
        <PanelRightOpen className="size-3.5" />
      </button>
    </div>
  );
}
