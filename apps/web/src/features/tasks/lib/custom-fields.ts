import type { CustomFieldType, CustomFieldSettingsDto, CustomFieldValueDto } from '@pm/contracts';

export const CUSTOM_FIELD_TYPE_OPTIONS: Array<{
  type: CustomFieldType;
  label: string;
  description: string;
}> = [
  { type: 'select', label: 'Selección única', description: 'Una opción de una lista' },
  { type: 'multiselect', label: 'Selección múltiple', description: 'Varias opciones' },
  { type: 'date', label: 'Fecha', description: 'Fecha única o rango inicio–fin' },
  { type: 'people', label: 'Personas', description: 'Miembros del proyecto' },
  { type: 'text', label: 'Texto', description: 'Texto libre' },
  { type: 'number', label: 'Número', description: 'Valor numérico' },
  { type: 'timer', label: 'Temporizador', description: 'Tiempo registrado' },
];

export function buildEmptyCustomFieldValue(
  type: CustomFieldType,
): CustomFieldValueDto {
  switch (type) {
    case 'select':
      return { type: 'select', optionId: null };
    case 'multiselect':
      return { type: 'multiselect', optionIds: [] };
    case 'date':
      return { type: 'date', date: null };
    case 'people':
      return { type: 'people', userIds: [] };
    case 'text':
      return { type: 'text', text: null };
    case 'number':
      return { type: 'number', number: null };
    case 'timer':
      return { type: 'timer', seconds: 0, runningSince: null };
    default:
      return { type: 'text', text: null };
  }
}

export function getDefaultSettingsForType(type: CustomFieldType): CustomFieldSettingsDto {
  switch (type) {
    case 'select':
    case 'multiselect':
      return {
        options: [
          { id: crypto.randomUUID(), label: 'Opción 1', color: null },
          { id: crypto.randomUUID(), label: 'Opción 2', color: null },
        ],
      };
    case 'date':
      return { includeTime: false };
    case 'people':
      return { allowMultiple: false };
    case 'text':
      return { maxLength: 255 };
    case 'number':
      return { precision: 0 };
    case 'timer':
      return {};
    default:
      return {};
  }
}
