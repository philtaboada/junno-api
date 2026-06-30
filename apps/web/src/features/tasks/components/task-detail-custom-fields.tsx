'use client';

import type {
  CustomFieldDefinitionDto,
  CustomFieldValueDto,
} from '@pm/contracts';
import type { AssigneePickerMember } from '@/features/tasks/components/task-assignee-picker';
import { CustomFieldCell } from '@/features/tasks/components/custom-field-cell';

type TaskDetailCustomFieldsProps = {
  customFields: CustomFieldDefinitionDto[];
  customFieldValues: Record<string, CustomFieldValueDto>;
  members: AssigneePickerMember[];
  canEdit: boolean;
  onCustomFieldChange: (
    fieldId: string,
    value: CustomFieldValueDto | null,
  ) => Promise<void>;
};

export function TaskDetailCustomFields({
  customFields,
  customFieldValues,
  members,
  canEdit,
  onCustomFieldChange,
}: TaskDetailCustomFieldsProps) {
  if (customFields.length === 0) {
    return null;
  }
  return (
    <section className="mt-4 border-t border-border/60 pt-4">
      <h3 className="mb-2 text-sm font-medium text-foreground">Campos personalizados</h3>
      <div className="flex flex-col gap-1">
        {customFields.map((field) => (
          <div
            key={field.id}
            className="grid grid-cols-[6.5rem_1fr] items-center gap-x-4 gap-y-1 py-2"
          >
            <span className="truncate text-sm text-muted-foreground">{field.name}</span>
            <CustomFieldCell
              field={field}
              value={customFieldValues[field.id]}
              members={members}
              canEdit={canEdit}
              onValueChange={(value) => onCustomFieldChange(field.id, value)}
            />
          </div>
        ))}
      </div>
    </section>
  );
}
