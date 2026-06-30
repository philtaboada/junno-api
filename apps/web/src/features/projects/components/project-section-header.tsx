'use client';

import { useEffect, useRef, useState } from 'react';
import { ChevronDown, ChevronRight, ChevronUp, Trash2 } from 'lucide-react';
import type { ProjectSectionDto } from '@pm/contracts';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

type ProjectSectionHeaderProps = {
  section: ProjectSectionDto;
  canEdit: boolean;
  canDelete: boolean;
  canMoveUp: boolean;
  canMoveDown: boolean;
  isCollapsed: boolean;
  taskCount?: number;
  onToggleCollapse: () => void;
  onRename: (sectionId: string, name: string) => Promise<void>;
  onDelete: (sectionId: string) => Promise<void>;
  onMoveUp: (sectionId: string) => Promise<void>;
  onMoveDown: (sectionId: string) => Promise<void>;
};

export function ProjectSectionHeader({
  section,
  canEdit,
  canDelete,
  canMoveUp,
  canMoveDown,
  isCollapsed,
  taskCount,
  onToggleCollapse,
  onRename,
  onDelete,
  onMoveUp,
  onMoveDown,
}: ProjectSectionHeaderProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState(section.name);
  const [isSaving, setIsSaving] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!isEditing) {
      setName(section.name);
    }
  }, [section.name, isEditing]);

  function startEditing(): void {
    if (!canEdit) {
      return;
    }
    setName(section.name);
    setIsEditing(true);
    requestAnimationFrame(() => {
      inputRef.current?.focus();
      inputRef.current?.select();
    });
  }

  async function handleSave(): Promise<void> {
    const trimmedName = name.trim();
    if (trimmedName.length < 1) {
      setName(section.name);
      setIsEditing(false);
      return;
    }
    if (trimmedName === section.name) {
      setIsEditing(false);
      return;
    }
    setIsSaving(true);
    try {
      await onRename(section.id, trimmedName);
      setIsEditing(false);
    } catch {
      setName(section.name);
    } finally {
      setIsSaving(false);
    }
  }

  function handleCancel(): void {
    setName(section.name);
    setIsEditing(false);
  }

  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        className="inline-flex size-5 shrink-0 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted/70 hover:text-foreground"
        aria-label={isCollapsed ? 'Mostrar tareas de la sección' : 'Ocultar tareas de la sección'}
        aria-expanded={!isCollapsed}
        disabled={isSaving}
        onClick={onToggleCollapse}
      >
        {isCollapsed ? (
          <ChevronRight className="size-4" />
        ) : (
          <ChevronDown className="size-4" />
        )}
      </button>
      {isEditing ? (
        <input
          ref={inputRef}
          type="text"
          value={name}
          disabled={isSaving}
          className="h-8 min-w-0 flex-1 rounded-md border border-border/80 bg-background px-2 text-sm font-semibold tracking-tight outline-none focus:ring-1 focus:ring-brand-indigo/40"
          onChange={(event) => setName(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'Enter') {
              event.preventDefault();
              void handleSave();
            }
            if (event.key === 'Escape') {
              event.preventDefault();
              handleCancel();
            }
          }}
          onBlur={() => {
            void handleSave();
          }}
        />
      ) : (
        <button
          type="button"
          className={cn(
            'min-w-0 flex-1 truncate text-left text-sm font-semibold tracking-tight',
            canEdit && 'cursor-text hover:text-brand-indigo',
          )}
          disabled={!canEdit}
          onClick={startEditing}
        >
          {section.name}
          {taskCount !== undefined ? (
            <span className="ml-2 text-xs font-normal text-muted-foreground">
              {taskCount}
            </span>
          ) : null}
        </button>
      )}
      {canEdit ? (
        <div className="flex shrink-0 items-center gap-1">
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            disabled={!canMoveUp || isSaving}
            onMouseDown={(event) => {
              event.preventDefault();
            }}
            onClick={() => void onMoveUp(section.id)}
            aria-label="Mover sección arriba"
          >
            <ChevronUp className="size-4 text-brand-indigo" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            disabled={!canMoveDown || isSaving}
            onMouseDown={(event) => {
              event.preventDefault();
            }}
            onClick={() => void onMoveDown(section.id)}
            aria-label="Mover sección abajo"
          >
            <ChevronDown className="size-4 text-brand-indigo" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            disabled={!canDelete || isSaving}
            onMouseDown={(event) => {
              event.preventDefault();
            }}
            onClick={() => void onDelete(section.id)}
            aria-label="Eliminar sección"
          >
            <Trash2 className="size-4 text-muted-foreground" />
          </Button>
        </div>
      ) : null}
    </div>
  );
}
