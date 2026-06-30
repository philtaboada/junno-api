'use client';

import { useState } from 'react';
import type { CustomFieldOptionDto, FormFieldDto } from '@pm/contracts';
import { Button } from '@/components/ui/button';
import { Field, FieldGroup, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';

type FormRendererProps = {
  fields: FormFieldDto[];
  onSubmit: (values: Record<string, unknown>) => Promise<void>;
  submitLabel?: string;
};

export function FormRenderer({
  fields,
  onSubmit,
  submitLabel = 'Enviar',
}: FormRendererProps) {
  const [values, setValues] = useState<Record<string, unknown>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);

  function updateValue(fieldId: string, value: unknown): void {
    setValues((currentValues) => ({ ...currentValues, [fieldId]: value }));
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);
    try {
      await onSubmit(values);
      setIsSuccess(true);
      setValues({});
    } catch (submitError) {
      setError(
        submitError instanceof Error ? submitError.message : 'No se pudo enviar el formulario',
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  if (isSuccess) {
    return (
      <div className="rounded-xl border border-border/80 bg-muted/30 p-6 text-center">
        <p className="font-medium">¡Enviado!</p>
        <p className="mt-1 text-sm text-muted-foreground">
          La tarea se creó correctamente en el proyecto.
        </p>
        <Button
          type="button"
          variant="outline"
          className="mt-4"
          onClick={() => setIsSuccess(false)}
        >
          Enviar otra respuesta
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={(event) => void handleSubmit(event)} className="flex flex-col gap-4">
      <FieldGroup className="gap-4">
        {fields.map((field) => (
          <Field key={field.id}>
            <FieldLabel htmlFor={field.id}>
              {field.label}
              {field.required ? ' *' : ''}
            </FieldLabel>
            {renderFieldInput(field, values[field.id], (value) => updateValue(field.id, value))}
          </Field>
        ))}
        {error ? <p className="text-sm text-destructive">{error}</p> : null}
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Enviando…' : submitLabel}
        </Button>
      </FieldGroup>
    </form>
  );
}

function renderFieldInput(
  field: FormFieldDto,
  value: unknown,
  onChange: (value: unknown) => void,
) {
  switch (field.type) {
    case 'task_name':
    case 'task_description':
      return field.type === 'task_description' ? (
        <textarea
          id={field.id}
          value={typeof value === 'string' ? value : ''}
          onChange={(event) => onChange(event.target.value)}
          rows={4}
          className="flex min-h-[5rem] w-full rounded-lg border border-input bg-transparent px-3 py-2 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30"
        />
      ) : (
        <Input
          id={field.id}
          value={typeof value === 'string' ? value : ''}
          onChange={(event) => onChange(event.target.value)}
        />
      );
    case 'due_at':
      return (
        <Input
          id={field.id}
          type="date"
          value={typeof value === 'string' ? value : ''}
          onChange={(event) => onChange(event.target.value)}
        />
      );
    case 'custom_field':
      return renderCustomFieldInput(field, value, onChange);
    default:
      return null;
  }
}

function renderCustomFieldInput(
  field: FormFieldDto,
  value: unknown,
  onChange: (value: unknown) => void,
) {
  const options = extractOptions(field.customFieldSettings);
  switch (field.customFieldType) {
    case 'text':
      return (
        <Input
          id={field.id}
          value={typeof value === 'string' ? value : ''}
          onChange={(event) => onChange(event.target.value)}
        />
      );
    case 'number':
      return (
        <Input
          id={field.id}
          type="number"
          value={typeof value === 'number' || typeof value === 'string' ? String(value) : ''}
          onChange={(event) => onChange(event.target.value)}
        />
      );
    case 'select':
      return (
        <select
          id={field.id}
          value={typeof value === 'string' ? value : ''}
          onChange={(event) => onChange(event.target.value)}
          className="h-9 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30"
        >
          <option value="">Selecciona…</option>
          {options.map((option) => (
            <option key={option.id} value={option.id}>
              {option.label}
            </option>
          ))}
        </select>
      );
    case 'multiselect':
      return (
        <select
          id={field.id}
          multiple
          value={Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string') : []}
          onChange={(event) =>
            onChange(Array.from(event.target.selectedOptions).map((option) => option.value))
          }
          className="min-h-[5rem] w-full rounded-lg border border-input bg-transparent px-2.5 py-2 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30"
        >
          {options.map((option) => (
            <option key={option.id} value={option.id}>
              {option.label}
            </option>
          ))}
        </select>
      );
    case 'date':
      return (
        <Input
          id={field.id}
          type="date"
          value={typeof value === 'string' ? value : ''}
          onChange={(event) => onChange(event.target.value)}
        />
      );
    default:
      return (
        <p className="text-sm text-muted-foreground">
          Tipo de campo no soportado en formularios.
        </p>
      );
  }
}

function extractOptions(settings: Record<string, unknown> | null): CustomFieldOptionDto[] {
  if (!settings || !Array.isArray(settings.options)) {
    return [];
  }
  return settings.options.filter(
    (option): option is CustomFieldOptionDto =>
      typeof option === 'object' &&
      option !== null &&
      typeof (option as CustomFieldOptionDto).id === 'string' &&
      typeof (option as CustomFieldOptionDto).label === 'string',
  );
}
