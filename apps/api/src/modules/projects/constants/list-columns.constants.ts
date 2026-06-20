import type { ProjectListFieldKey } from '@pm/contracts';

export type DefaultListColumnSeed = {
  readonly fieldKey: ProjectListFieldKey;
  readonly position: number;
  readonly visible: boolean;
  readonly width: number | null;
};

export const DEFAULT_PROJECT_LIST_COLUMNS: readonly DefaultListColumnSeed[] = [
  { fieldKey: 'name', position: 0, visible: true, width: null },
  { fieldKey: 'due_at', position: 1, visible: true, width: 108 },
  { fieldKey: 'assignee', position: 2, visible: true, width: 72 },
] as const;
