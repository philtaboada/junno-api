'use client';

import type { CustomFieldDefinitionDto, TaskSummaryDto } from '@pm/contracts';
import { getTaskCustomFieldBadges } from '@/features/tasks/lib/format-custom-field-display';
import { cn } from '@/lib/utils';

type CustomFieldBoardBadgesProps = {
  task: TaskSummaryDto;
  customFields: CustomFieldDefinitionDto[];
  memberNamesById?: ReadonlyMap<string, string>;
  className?: string;
};

export function CustomFieldBoardBadges({
  task,
  customFields,
  memberNamesById,
  className,
}: CustomFieldBoardBadgesProps) {
  const badges = getTaskCustomFieldBadges(task, customFields, memberNamesById);
  if (badges.length === 0) {
    return null;
  }
  return (
    <div className={cn('mt-2 flex flex-wrap gap-1.5', className)}>
      {badges.map((badge) => (
        <span
          key={badge.fieldId}
          className="inline-flex max-w-full items-center gap-1 rounded-md bg-muted/70 px-2 py-0.5 text-[11px] text-muted-foreground"
          title={`${badge.label}: ${badge.value}`}
        >
          <span className="truncate font-medium text-foreground/80">{badge.label}</span>
          <span className="truncate">{badge.value}</span>
        </span>
      ))}
    </div>
  );
}
