import type {
  CustomFieldDefinitionDto,
  ProjectListColumnDto,
  ProjectListFieldKey,
} from '@pm/contracts';

export type BuiltinListColumnDefinition = {
  readonly fieldKey: ProjectListFieldKey;
  readonly label: string;
  readonly defaultVisible: boolean;
  readonly minWidth: number;
};

export const BUILTIN_LIST_COLUMN_DEFINITIONS: Record<
  ProjectListFieldKey,
  BuiltinListColumnDefinition
> = {
  name: {
    fieldKey: 'name',
    label: 'Nombre',
    defaultVisible: true,
    minWidth: 280,
  },
  due_at: {
    fieldKey: 'due_at',
    label: 'Fechas',
    defaultVisible: true,
    minWidth: 148,
  },
  assignee: {
    fieldKey: 'assignee',
    label: 'Asignado',
    defaultVisible: true,
    minWidth: 72,
  },
};

export const FALLBACK_LIST_COLUMNS: ProjectListColumnDto[] = [
  { id: 'name', fieldKey: 'name', customFieldId: null, position: 0, visible: true, width: null },
  {
    id: 'due_at',
    fieldKey: 'due_at',
    customFieldId: null,
    position: 1,
    visible: true,
    width: 108,
  },
  {
    id: 'assignee',
    fieldKey: 'assignee',
    customFieldId: null,
    position: 2,
    visible: true,
    width: 72,
  },
];

export function resolveVisibleListColumns(
  columns: ProjectListColumnDto[] | undefined,
): ProjectListColumnDto[] {
  const source = columns && columns.length > 0 ? columns : FALLBACK_LIST_COLUMNS;
  return [...source]
    .filter((column) => column.visible && column.fieldKey !== 'name')
    .sort((left, right) => left.position - right.position);
}

export function getColumnLabel(
  column: ProjectListColumnDto,
  customFields: CustomFieldDefinitionDto[],
): string {
  if (column.fieldKey) {
    return BUILTIN_LIST_COLUMN_DEFINITIONS[column.fieldKey].label;
  }
  if (column.customFieldId) {
    const field = customFields.find((item) => item.id === column.customFieldId);
    return field?.name ?? 'Campo';
  }
  return 'Campo';
}

export function getColumnMinWidth(
  column: ProjectListColumnDto,
  customFields: CustomFieldDefinitionDto[],
): number {
  if (column.width) {
    return column.width;
  }
  if (column.fieldKey) {
    return BUILTIN_LIST_COLUMN_DEFINITIONS[column.fieldKey].minWidth;
  }
  const field = customFields.find((item) => item.id === column.customFieldId);
  switch (field?.type) {
    case 'text':
      return 180;
    case 'number':
      return 88;
    case 'timer':
      return 96;
    case 'people':
      return 96;
    case 'date':
      return field?.settings.isRange ? 148 : 108;
    case 'multiselect':
    case 'select':
      return 120;
    default:
      return 120;
  }
}

export type ListGridLayoutOptions = {
  showProject?: boolean;
  showTrailingActions?: boolean;
};

const EXPAND_COLUMN_WIDTH = '1.25rem';
const CHECKBOX_COLUMN_WIDTH = '2rem';
const NAME_COLUMN_WIDTH = 'minmax(0, 1fr)';
const NAME_COLUMN_MIN_PX = 192;
const PROJECT_COLUMN_WIDTH = '7rem';
const TRAILING_ACTIONS_COLUMN_WIDTH = '2rem';
const GRID_COLUMN_GAP_PX = 12;
const GRID_HORIZONTAL_PADDING_PX = 32;

export const LIST_GRID_ROW_CLASSNAME = 'grid w-full min-w-0 items-center';

/** Grid column span covering expand + checkbox + name for indented subtask rows. */
export const SUBTASK_LEADING_GRID_COLUMN = '1 / 4';

export const SUBTASK_INDENT_CLASSNAME =
  'ml-5 flex min-w-0 items-center gap-2.5 border-l-2 border-brand-indigo/25 pl-4';

export function buildListGridTemplate(
  columns: ProjectListColumnDto[],
  customFields: CustomFieldDefinitionDto[] = [],
  options: ListGridLayoutOptions = {},
): string {
  const visibleDataColumns = resolveVisibleListColumns(columns);
  const parts = [EXPAND_COLUMN_WIDTH, CHECKBOX_COLUMN_WIDTH, NAME_COLUMN_WIDTH];
  for (const column of visibleDataColumns) {
    parts.push(`${getColumnMinWidth(column, customFields)}px`);
  }
  if (options.showProject) {
    parts.push(PROJECT_COLUMN_WIDTH);
  }
  if (options.showTrailingActions) {
    parts.push(TRAILING_ACTIONS_COLUMN_WIDTH);
  }
  return parts.join(' ');
}

export function buildListGridMinWidth(
  columns: ProjectListColumnDto[],
  customFields: CustomFieldDefinitionDto[] = [],
  options: ListGridLayoutOptions = {},
): number {
  const visibleDataColumns = resolveVisibleListColumns(columns);
  let columnCount = 3 + visibleDataColumns.length;
  let width = 20 + 32 + NAME_COLUMN_MIN_PX;
  for (const column of visibleDataColumns) {
    width += getColumnMinWidth(column, customFields);
  }
  if (options.showProject) {
    width += 112;
    columnCount += 1;
  }
  if (options.showTrailingActions) {
    width += 32;
    columnCount += 1;
  }
  width += Math.max(0, columnCount - 1) * GRID_COLUMN_GAP_PX + GRID_HORIZONTAL_PADDING_PX;
  return width;
}

export function buildListGridStyle(
  columns: ProjectListColumnDto[],
  customFields: CustomFieldDefinitionDto[] = [],
  options: ListGridLayoutOptions = {},
): {
  display: 'grid';
  width: string;
  minWidth: number;
  gridTemplateColumns: string;
  columnGap: string;
} {
  return {
    display: 'grid',
    width: '100%',
    minWidth: buildListGridMinWidth(columns, customFields, options),
    gridTemplateColumns: buildListGridTemplate(columns, customFields, options),
    columnGap: '0.75rem',
  };
}

export function getCustomFieldForColumn(
  column: ProjectListColumnDto,
  customFields: CustomFieldDefinitionDto[],
): CustomFieldDefinitionDto | null {
  if (!column.customFieldId) {
    return null;
  }
  return customFields.find((field) => field.id === column.customFieldId) ?? null;
}
