'use client';

import { useMemo, useState } from 'react';
import { ChevronDown, ChevronUp, Columns3, Eye, EyeOff } from 'lucide-react';
import { toast } from 'sonner';
import type {
  CustomFieldDefinitionDto,
  ListColumnUpdateRequestDto,
  ProjectListColumnDto,
  ProjectListFieldKey,
} from '@pm/contracts';
import {
  BUILTIN_LIST_COLUMN_DEFINITIONS,
  getColumnLabel,
} from '@/features/tasks/lib/list-column-registry';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { cn } from '@/lib/utils';

type ListColumnsSettingsMenuProps = {
  listColumns: ProjectListColumnDto[];
  customFields: CustomFieldDefinitionDto[];
  canEdit: boolean;
  onSave: (columns: ListColumnUpdateRequestDto[]) => Promise<void>;
};

type DraftColumn = {
  readonly fieldKey: ProjectListFieldKey | null;
  readonly customFieldId: string | null;
  readonly position: number;
  readonly visible: boolean;
  readonly width: number | null;
};

function buildDraftColumns(listColumns: ProjectListColumnDto[]): DraftColumn[] {
  return [...listColumns]
    .sort((left, right) => left.position - right.position)
    .map((column) => ({
      fieldKey: column.fieldKey,
      customFieldId: column.customFieldId,
      position: column.position,
      visible: column.visible,
      width: column.width,
    }));
}

function normalizeDraftPositions(columns: DraftColumn[]): DraftColumn[] {
  return columns.map((column, index) => ({
    ...column,
    position: index,
  }));
}

function getDraftColumnKey(column: DraftColumn): string {
  return column.customFieldId ?? column.fieldKey ?? 'unknown';
}

export function ListColumnsSettingsMenu({
  listColumns,
  customFields,
  canEdit,
  onSave,
}: ListColumnsSettingsMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [draftColumns, setDraftColumns] = useState<DraftColumn[]>(() =>
    buildDraftColumns(listColumns),
  );
  const sortedDraftColumns = useMemo(
    () => [...draftColumns].sort((left, right) => left.position - right.position),
    [draftColumns],
  );

  function handleOpenChange(open: boolean): void {
    setIsOpen(open);
    if (open) {
      setDraftColumns(buildDraftColumns(listColumns));
    }
  }

  function moveColumn(columnKey: string, direction: 'up' | 'down'): void {
    const ordered = [...sortedDraftColumns];
    const index = ordered.findIndex((column) => getDraftColumnKey(column) === columnKey);
    if (index < 0) {
      return;
    }
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= ordered.length) {
      return;
    }
    const nextOrdered = [...ordered];
    const current = nextOrdered[index];
    const target = nextOrdered[targetIndex];
    if (!current || !target) {
      return;
    }
    nextOrdered[index] = target;
    nextOrdered[targetIndex] = current;
    setDraftColumns(normalizeDraftPositions(nextOrdered));
  }

  function toggleVisibility(column: DraftColumn): void {
    if (column.fieldKey === 'name') {
      return;
    }
    const columnKey = getDraftColumnKey(column);
    setDraftColumns((current) =>
      current.map((item) =>
        getDraftColumnKey(item) === columnKey
          ? { ...item, visible: !item.visible }
          : item,
      ),
    );
  }

  async function handleSave(): Promise<void> {
    setIsSaving(true);
    try {
      const payload: ListColumnUpdateRequestDto[] = normalizeDraftPositions(
        sortedDraftColumns,
      ).map((column) => ({
        fieldKey: column.fieldKey,
        customFieldId: column.customFieldId,
        position: column.position,
        visible: column.visible,
        width: column.width,
      }));
      await onSave(payload);
      setIsOpen(false);
      toast.success('Columnas actualizadas');
    } catch {
      toast.error('No se pudieron guardar las columnas');
    } finally {
      setIsSaving(false);
    }
  }

  if (!canEdit) {
    return null;
  }

  return (
    <Popover open={isOpen} onOpenChange={handleOpenChange}>
      <PopoverTrigger
        render={
          <Button type="button" variant="outline" size="sm" className="h-8 gap-1.5">
            <Columns3 className="size-3.5 text-brand-indigo" />
            Columnas
          </Button>
        }
      />
      <PopoverContent align="end" className="w-72 p-0">
        <div className="border-b border-border/70 px-3 py-2">
          <p className="text-sm font-medium">Columnas de la lista</p>
          <p className="text-xs text-muted-foreground">
            Muestra, oculta y reordena columnas.
          </p>
        </div>
        <div className="max-h-72 overflow-y-auto p-2">
          {sortedDraftColumns.map((column, index) => {
            const isNameColumn = column.fieldKey === 'name';
            const label = column.fieldKey
              ? BUILTIN_LIST_COLUMN_DEFINITIONS[column.fieldKey].label
              : getColumnLabel(
                  {
                    id: column.customFieldId ?? '',
                    fieldKey: null,
                    customFieldId: column.customFieldId,
                    position: column.position,
                    visible: column.visible,
                    width: column.width,
                  },
                  customFields,
                );
            const columnKey = getDraftColumnKey(column);
            return (
              <div
                key={columnKey}
                className="flex items-center gap-2 rounded-md px-1 py-1.5 hover:bg-muted/40"
              >
                <button
                  type="button"
                  disabled={isNameColumn || isSaving}
                  className={cn(
                    'flex size-7 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted/80',
                    isNameColumn && 'cursor-not-allowed opacity-40',
                  )}
                  aria-label={column.visible ? `Ocultar ${label}` : `Mostrar ${label}`}
                  onClick={() => toggleVisibility(column)}
                >
                  {column.visible ? (
                    <Eye className="size-3.5" />
                  ) : (
                    <EyeOff className="size-3.5" />
                  )}
                </button>
                <span
                  className={cn(
                    'min-w-0 flex-1 truncate text-sm',
                    !column.visible && 'text-muted-foreground',
                  )}
                >
                  {label}
                </span>
                <div className="flex items-center">
                  <button
                    type="button"
                    disabled={index === 0 || isSaving}
                    className="flex size-7 items-center justify-center rounded-md text-muted-foreground hover:bg-muted/80 disabled:opacity-40"
                    aria-label={`Subir ${label}`}
                    onClick={() => moveColumn(columnKey, 'up')}
                  >
                    <ChevronUp className="size-3.5" />
                  </button>
                  <button
                    type="button"
                    disabled={index === sortedDraftColumns.length - 1 || isSaving}
                    className="flex size-7 items-center justify-center rounded-md text-muted-foreground hover:bg-muted/80 disabled:opacity-40"
                    aria-label={`Bajar ${label}`}
                    onClick={() => moveColumn(columnKey, 'down')}
                  >
                    <ChevronDown className="size-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
        <div className="flex justify-end gap-2 border-t border-border/70 p-2">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            disabled={isSaving}
            onClick={() => setIsOpen(false)}
          >
            Cancelar
          </Button>
          <Button
            type="button"
            size="sm"
            disabled={isSaving}
            onClick={() => void handleSave()}
          >
            {isSaving ? 'Guardando…' : 'Guardar'}
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
