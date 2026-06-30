'use client';

import { useState } from 'react';
import type {
  CustomFieldDefinitionDto,
  CustomFieldSettingsDto,
  CustomFieldType,
} from '@pm/contracts';
import { CustomFieldOptionsEditor } from '@/features/tasks/components/custom-field-options-editor';
import {
  CUSTOM_FIELD_TYPE_OPTIONS,
  getDefaultSettingsForType,
} from '@/features/tasks/lib/custom-fields';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { cn } from '@/lib/utils';

function getCustomFieldTypeLabel(type: CustomFieldType): string {
  return (
    CUSTOM_FIELD_TYPE_OPTIONS.find((option) => option.type === type)?.label ?? type
  );
}

type CustomFieldTypeBadgeProps = {
  type: CustomFieldType;
};

function CustomFieldTypeBadge({ type }: CustomFieldTypeBadgeProps) {
  return (
    <span className="inline-flex w-fit items-center rounded-full bg-brand-indigo-muted px-3 py-1 text-xs font-medium text-brand-indigo">
      {getCustomFieldTypeLabel(type)}
    </span>
  );
}

type CustomFieldSettingsFieldsProps = {
  type: CustomFieldType;
  settings: CustomFieldSettingsDto;
  disabled?: boolean;
  onSettingsChange: (settings: CustomFieldSettingsDto) => void;
};

function CustomFieldSettingsFields({
  type,
  settings,
  disabled = false,
  onSettingsChange,
}: CustomFieldSettingsFieldsProps) {
  if (type === 'select' || type === 'multiselect') {
    return (
      <CustomFieldOptionsEditor
        options={settings.options ?? []}
        disabled={disabled}
        onChange={(options) => onSettingsChange({ ...settings, options })}
      />
    );
  }
  if (type === 'date') {
    return (
      <>
        <SettingToggleCard
          id="custom-field-is-range"
          label="Usar rango de fechas"
          description="Permite elegir fecha de inicio y fin en un solo campo."
          checked={settings.isRange ?? false}
          disabled={disabled}
          onCheckedChange={(checked) =>
            onSettingsChange({ ...settings, isRange: checked })
          }
        />
        <SettingToggleCard
          id="custom-field-include-time"
          label="Incluir hora"
          description="Permite elegir fecha y hora en lugar de solo el día."
          checked={settings.includeTime ?? false}
          disabled={disabled || (settings.isRange ?? false)}
          onCheckedChange={(checked) =>
            onSettingsChange({ ...settings, includeTime: checked })
          }
        />
      </>
    );
  }
  if (type === 'people') {
    return (
      <SettingToggleCard
        id="custom-field-allow-multiple"
        label="Permitir varias personas"
        description="Los usuarios podrán asignar más de un miembro al campo."
        checked={settings.allowMultiple ?? false}
        disabled={disabled}
        onCheckedChange={(checked) =>
          onSettingsChange({ ...settings, allowMultiple: checked })
        }
      />
    );
  }
  if (type === 'number') {
    return (
      <div className="flex flex-col gap-2">
        <Label htmlFor="custom-field-precision">Decimales</Label>
        <Input
          id="custom-field-precision"
          type="number"
          min={0}
          max={4}
          value={settings.precision ?? 0}
          disabled={disabled}
          className="max-w-[8rem]"
          onChange={(event) =>
            onSettingsChange({
              ...settings,
              precision: Number.parseInt(event.target.value, 10) || 0,
            })
          }
        />
        <p className="text-xs text-muted-foreground">
          Número de decimales al mostrar el valor. Usa 0 para números enteros.
        </p>
      </div>
    );
  }
  if (type === 'timer') {
    return (
      <p className="text-sm text-muted-foreground">
        Los miembros podrán iniciar y detener un temporizador directamente en la
        celda de la lista.
      </p>
    );
  }
  if (type === 'text') {
    return (
      <p className="text-sm text-muted-foreground">
        Campo de texto libre para notas cortas en cada tarea.
      </p>
    );
  }
  return null;
}

type SettingToggleCardProps = {
  id: string;
  label: string;
  description: string;
  checked: boolean;
  disabled?: boolean;
  onCheckedChange: (checked: boolean) => void;
};

function SettingToggleCard({
  id,
  label,
  description,
  checked,
  disabled = false,
  onCheckedChange,
}: SettingToggleCardProps) {
  return (
    <div className="flex items-start gap-3 rounded-xl border border-border/70 bg-muted/15 p-4">
      <Checkbox
        id={id}
        checked={checked}
        disabled={disabled}
        onCheckedChange={(value) => {
          if (typeof value === 'boolean') {
            onCheckedChange(value);
          }
        }}
      />
      <div className="flex min-w-0 flex-col gap-1">
        <Label htmlFor={id} className="cursor-pointer font-medium">
          {label}
        </Label>
        <p className="text-xs leading-relaxed text-muted-foreground">{description}</p>
      </div>
    </div>
  );
}

const SHEET_CONTENT_CLASSNAME =
  'flex w-full max-w-md flex-col gap-0 overflow-hidden p-0 sm:max-w-md';

type CreateCustomFieldDialogProps = {
  open: boolean;
  initialType: CustomFieldType | null;
  isSaving: boolean;
  onOpenChange: (open: boolean) => void;
  onCreate: (input: {
    name: string;
    type: CustomFieldType;
    settings: CustomFieldSettingsDto;
  }) => Promise<void>;
};

export function CreateCustomFieldDialog({
  open,
  initialType,
  isSaving,
  onOpenChange,
  onCreate,
}: CreateCustomFieldDialogProps) {
  const [name, setName] = useState('');
  const [type, setType] = useState<CustomFieldType>(initialType ?? 'select');
  const [settings, setSettings] = useState<CustomFieldSettingsDto>(
    getDefaultSettingsForType(initialType ?? 'select'),
  );

  function handleTypeChange(nextType: CustomFieldType): void {
    setType(nextType);
    setSettings(getDefaultSettingsForType(nextType));
  }

  async function handleSubmit(): Promise<void> {
    const trimmedName = name.trim();
    if (trimmedName.length < 1) {
      return;
    }
    await onCreate({ name: trimmedName, type, settings });
    setName('');
    setType(initialType ?? 'select');
    setSettings(getDefaultSettingsForType(initialType ?? 'select'));
  }

  return (
    <Sheet
      open={open}
      onOpenChange={(nextOpen) => {
        onOpenChange(nextOpen);
        if (nextOpen && initialType) {
          setType(initialType);
          setSettings(getDefaultSettingsForType(initialType));
        }
      }}
    >
      <SheetContent side="right" className={SHEET_CONTENT_CLASSNAME}>
        <SheetHeader className="border-b border-border/60 px-6 py-5">
          <SheetTitle className="text-lg font-semibold tracking-tight">
            Nuevo campo personalizado
          </SheetTitle>
          <SheetDescription className="mt-1.5 leading-relaxed">
            Define el nombre y la configuración antes de añadirlo a la lista.
          </SheetDescription>
        </SheetHeader>
        <div className="flex-1 overflow-y-auto px-6 py-6">
          <div className="flex flex-col gap-6">
            <section className="flex flex-col gap-2">
              <Label htmlFor="custom-field-name">Nombre</Label>
              <Input
                id="custom-field-name"
                value={name}
                disabled={isSaving}
                placeholder="Ej. Prioridad, Estado, Horas…"
                onChange={(event) => setName(event.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Aparecerá como encabezado de columna en la vista lista.
              </p>
            </section>
            <Separator />
            <section className="flex flex-col gap-3">
              <div>
                <h3 className="text-sm font-medium text-foreground">Tipo de campo</h3>
                <p className="mt-1 text-xs text-muted-foreground">
                  El tipo no se puede cambiar después de crear el campo.
                </p>
              </div>
              <div className="grid gap-2">
                {CUSTOM_FIELD_TYPE_OPTIONS.map((option) => (
                  <button
                    key={option.type}
                    type="button"
                    disabled={isSaving}
                    className={cn(
                      'rounded-xl border px-4 py-3 text-left transition-colors',
                      type === option.type
                        ? 'border-brand-indigo bg-brand-indigo-muted'
                        : 'border-border/70 hover:bg-muted/40',
                    )}
                    onClick={() => handleTypeChange(option.type)}
                  >
                    <span className="text-sm font-medium">{option.label}</span>
                    <span className="mt-0.5 block text-xs text-muted-foreground">
                      {option.description}
                    </span>
                  </button>
                ))}
              </div>
            </section>
            <Separator />
            <section className="flex flex-col gap-4">
              <h3 className="text-sm font-medium text-foreground">Configuración</h3>
              <CustomFieldSettingsFields
                type={type}
                settings={settings}
                disabled={isSaving}
                onSettingsChange={setSettings}
              />
            </section>
          </div>
        </div>
        <SheetFooter className="border-t border-border/60 bg-muted/15 px-6 py-4">
          <Button
            type="button"
            className="w-full"
            disabled={isSaving || name.trim().length < 1}
            onClick={() => void handleSubmit()}
          >
            {isSaving ? 'Creando…' : 'Crear campo'}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}

type EditCustomFieldDialogProps = {
  field: CustomFieldDefinitionDto | null;
  open: boolean;
  isSaving: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (input: { name: string; settings: CustomFieldSettingsDto }) => Promise<void>;
  onDelete: () => Promise<void>;
};

export function EditCustomFieldDialog({
  field,
  open,
  isSaving,
  onOpenChange,
  onSave,
  onDelete,
}: EditCustomFieldDialogProps) {
  if (!field) {
    return null;
  }
  return (
    <EditCustomFieldDialogContent
      key={field.id}
      field={field}
      open={open}
      isSaving={isSaving}
      onOpenChange={onOpenChange}
      onSave={onSave}
      onDelete={onDelete}
    />
  );
}

function EditCustomFieldDialogContent({
  field,
  open,
  isSaving,
  onOpenChange,
  onSave,
  onDelete,
}: EditCustomFieldDialogProps & { field: CustomFieldDefinitionDto }) {
  const [name, setName] = useState(field.name);
  const [settings, setSettings] = useState<CustomFieldSettingsDto>(field.settings);
  const hasConfiguration =
    field.type === 'select' ||
    field.type === 'multiselect' ||
    field.type === 'date' ||
    field.type === 'people' ||
    field.type === 'number' ||
    field.type === 'timer' ||
    field.type === 'text';

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className={SHEET_CONTENT_CLASSNAME}>
        <SheetHeader className="border-b border-border/60 px-6 py-5">
          <SheetTitle className="text-lg font-semibold tracking-tight">
            Ajustes del campo
          </SheetTitle>
          <SheetDescription className="mt-1.5 leading-relaxed">
            Configura cómo aparece «{field.name}» en la lista de tareas.
          </SheetDescription>
          <div className="mt-4">
            <CustomFieldTypeBadge type={field.type} />
          </div>
        </SheetHeader>
        <div className="flex-1 overflow-y-auto px-6 py-6">
          <div className="flex flex-col gap-6">
            <section className="flex flex-col gap-2">
              <Label htmlFor="edit-custom-field-name">Nombre</Label>
              <Input
                id="edit-custom-field-name"
                value={name}
                disabled={isSaving}
                onChange={(event) => setName(event.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Visible en el encabezado de la columna.
              </p>
            </section>
            {hasConfiguration ? (
              <>
                <Separator />
                <section className="flex flex-col gap-4">
                  <h3 className="text-sm font-medium text-foreground">Configuración</h3>
                  <CustomFieldSettingsFields
                    type={field.type}
                    settings={settings}
                    disabled={isSaving}
                    onSettingsChange={setSettings}
                  />
                </section>
              </>
            ) : null}
          </div>
        </div>
        <SheetFooter className="gap-3 border-t border-border/60 bg-muted/15 px-6 py-4">
          <Button
            type="button"
            className="w-full"
            disabled={isSaving || name.trim().length < 1}
            onClick={() => void onSave({ name: name.trim(), settings })}
          >
            {isSaving ? 'Guardando…' : 'Guardar cambios'}
          </Button>
          <Button
            type="button"
            variant="ghost"
            className="w-full text-destructive hover:bg-destructive/10 hover:text-destructive"
            disabled={isSaving}
            onClick={() => void onDelete()}
          >
            Eliminar campo
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
