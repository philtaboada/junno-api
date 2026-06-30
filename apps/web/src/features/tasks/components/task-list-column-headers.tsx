import type { CustomFieldDefinitionDto, ProjectListColumnDto } from '@pm/contracts';
import { AddCustomFieldMenu } from '@/features/tasks/components/add-custom-field-menu';
import {
  BUILTIN_LIST_COLUMN_DEFINITIONS,
  buildListGridStyle,
  getColumnLabel,
  LIST_GRID_ROW_CLASSNAME,
  resolveVisibleListColumns,
} from '@/features/tasks/lib/list-column-registry';
import type { CustomFieldType } from '@pm/contracts';
import { cn } from '@/lib/utils';

type TaskListColumnHeadersProps = {
  listColumns: ProjectListColumnDto[];
  customFields: CustomFieldDefinitionDto[];
  showProject?: boolean;
  showTrailingActions?: boolean;
  canEdit?: boolean;
  isCreatingField?: boolean;
  className?: string;
  onAddCustomField?: (input: {
    name: string;
    type: CustomFieldType;
    settings: import('@pm/contracts').CustomFieldSettingsDto;
  }) => Promise<void>;
  onEditCustomField?: (fieldId: string) => void;
};

export function TaskListColumnHeaders({
  listColumns,
  customFields,
  showProject = false,
  showTrailingActions = false,
  canEdit = false,
  isCreatingField = false,
  className,
  onAddCustomField,
  onEditCustomField,
}: TaskListColumnHeadersProps) {
  const visibleColumns = resolveVisibleListColumns(listColumns);
  const gridStyle = buildListGridStyle(listColumns, customFields, {
    showProject,
    showTrailingActions,
  });

  return (
    <div className={cn('border-b border-border/70 bg-muted/20 px-4 py-2', className)}>
      <div
        className={cn(LIST_GRID_ROW_CLASSNAME, 'text-xs font-medium text-muted-foreground')}
        style={gridStyle}
      >
        <span aria-hidden className="size-4 shrink-0" />
        <span aria-hidden className="size-4 shrink-0" />
        <span className="min-w-0 truncate">{BUILTIN_LIST_COLUMN_DEFINITIONS.name.label}</span>
        {visibleColumns.map((column) => (
          <button
            key={column.id}
            type="button"
            className={cn(
              'min-w-0 overflow-hidden truncate text-left hover:text-foreground',
              column.fieldKey === 'assignee' && 'text-center',
              column.customFieldId && canEdit && 'cursor-pointer',
            )}
            onClick={() => {
              if (column.customFieldId && onEditCustomField) {
                onEditCustomField(column.customFieldId);
              }
            }}
          >
            {getColumnLabel(column, customFields)}
          </button>
        ))}
        {showProject ? <span className="min-w-0 truncate">Proyecto</span> : null}
        {showTrailingActions ? (
          canEdit && onAddCustomField ? (
            <AddCustomFieldMenu
              canEdit={canEdit}
              isSaving={isCreatingField}
              onCreate={onAddCustomField}
            />
          ) : (
            <span aria-hidden className="size-7 shrink-0" />
          )
        ) : null}
      </div>
    </div>
  );
}
