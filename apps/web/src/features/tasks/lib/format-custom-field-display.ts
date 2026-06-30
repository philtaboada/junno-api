import type {
  CustomFieldDefinitionDto,
  CustomFieldValueDto,
} from '@pm/contracts';
import { buildEmptyCustomFieldValue } from '@/features/tasks/lib/custom-fields';
import { formatTaskDateRange } from '@/features/tasks/lib/format-due-date';

type FormatCustomFieldDisplayInput = {
  readonly field: CustomFieldDefinitionDto;
  readonly value: CustomFieldValueDto | undefined;
  readonly memberNamesById?: ReadonlyMap<string, string>;
};

export function formatCustomFieldDisplay({
  field,
  value,
  memberNamesById = new Map(),
}: FormatCustomFieldDisplayInput): string | null {
  const resolvedValue = value ?? buildEmptyCustomFieldValue(field.type);
  switch (resolvedValue.type) {
    case 'select': {
      if (!resolvedValue.optionId) {
        return null;
      }
      const option = field.settings.options?.find(
        (item) => item.id === resolvedValue.optionId,
      );
      return option?.label ?? null;
    }
    case 'multiselect': {
      if (resolvedValue.optionIds.length === 0) {
        return null;
      }
      const labels = resolvedValue.optionIds
        .map(
          (optionId) =>
            field.settings.options?.find((item) => item.id === optionId)?.label,
        )
        .filter((label): label is string => Boolean(label));
      return labels.length > 0 ? labels.join(', ') : null;
    }
    case 'date': {
      if (field.settings.isRange) {
        const range = formatTaskDateRange(
          resolvedValue.startDate ?? null,
          resolvedValue.endDate ?? null,
          null,
        );
        return range?.label ?? null;
      }
      if (!resolvedValue.date) {
        return null;
      }
      const range = formatTaskDateRange(null, resolvedValue.date, null);
      return range?.label ?? null;
    }
    case 'people': {
      if (resolvedValue.userIds.length === 0) {
        return null;
      }
      const names = resolvedValue.userIds
        .map((userId) => memberNamesById.get(userId))
        .filter((name): name is string => Boolean(name));
      return names.length > 0 ? names.join(', ') : null;
    }
    case 'text':
      return resolvedValue.text?.trim() ? resolvedValue.text.trim() : null;
    case 'number':
      return resolvedValue.number === null ? null : String(resolvedValue.number);
    case 'timer': {
      if (resolvedValue.seconds <= 0 && !resolvedValue.runningSince) {
        return null;
      }
      const totalSeconds = resolvedValue.runningSince
        ? resolvedValue.seconds +
          Math.max(
            0,
            Math.floor(
              (Date.now() - new Date(resolvedValue.runningSince).getTime()) / 1000,
            ),
          )
        : resolvedValue.seconds;
      const hours = Math.floor(totalSeconds / 3600);
      const minutes = Math.floor((totalSeconds % 3600) / 60);
      if (hours > 0) {
        return `${hours}h ${minutes}m`;
      }
      return `${minutes}m`;
    }
    default:
      return null;
  }
}

export function getTaskCustomFieldBadges(
  task: { readonly customFieldValues: Record<string, CustomFieldValueDto> },
  customFields: CustomFieldDefinitionDto[],
  memberNamesById?: ReadonlyMap<string, string>,
): Array<{ readonly fieldId: string; readonly label: string; readonly value: string }> {
  return customFields
    .map((field) => {
      const display = formatCustomFieldDisplay({
        field,
        value: task.customFieldValues[field.id],
        memberNamesById,
      });
      if (!display) {
        return null;
      }
      return {
        fieldId: field.id,
        label: field.name,
        value: display,
      };
    })
    .filter(
      (
        item,
      ): item is { readonly fieldId: string; readonly label: string; readonly value: string } =>
        item !== null,
    );
}
