'use client';

import { Plus, Trash2 } from 'lucide-react';
import type { CustomFieldOptionDto } from '@pm/contracts';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

type CustomFieldOptionsEditorProps = {
  options: CustomFieldOptionDto[];
  onChange: (options: CustomFieldOptionDto[]) => void;
  disabled?: boolean;
};

export function CustomFieldOptionsEditor({
  options,
  onChange,
  disabled = false,
}: CustomFieldOptionsEditorProps) {
  function updateOption(index: number, label: string): void {
    onChange(
      options.map((option, optionIndex) =>
        optionIndex === index ? { ...option, label } : option,
      ),
    );
  }

  function addOption(): void {
    onChange([
      ...options,
      { id: crypto.randomUUID(), label: `Opción ${options.length + 1}`, color: null },
    ]);
  }

  function removeOption(index: number): void {
    if (options.length <= 1) {
      return;
    }
    onChange(options.filter((_, optionIndex) => optionIndex !== index));
  }

  return (
    <div className="flex flex-col gap-3">
      <div>
        <p className="text-sm font-medium text-foreground">Opciones</p>
        <p className="mt-1 text-xs text-muted-foreground">
          Define las etiquetas que podrán elegirse en cada tarea.
        </p>
      </div>
      <div className="flex flex-col gap-2">
      {options.map((option, index) => (
        <div key={option.id} className="flex items-center gap-2">
          <Input
            value={option.label}
            disabled={disabled}
            placeholder={`Opción ${index + 1}`}
            onChange={(event) => updateOption(index, event.target.value)}
          />
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            disabled={disabled || options.length <= 1}
            onClick={() => removeOption(index)}
          >
            <Trash2 className="size-3.5" />
          </Button>
        </div>
      ))}
      </div>
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="w-fit"
        disabled={disabled}
        onClick={addOption}
      >
        <Plus className="size-3.5" />
        Añadir opción
      </Button>
    </div>
  );
}
