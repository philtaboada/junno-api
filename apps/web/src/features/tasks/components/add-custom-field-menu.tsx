'use client';

import { useState } from 'react';
import {
  Calendar,
  Check,
  CheckCheck,
  Clock,
  Hash,
  Plus,
  Type,
  Users,
} from 'lucide-react';
import type { CustomFieldType } from '@pm/contracts';
import { CreateCustomFieldDialog } from '@/features/tasks/components/custom-field-dialogs';
import { CUSTOM_FIELD_TYPE_OPTIONS } from '@/features/tasks/lib/custom-fields';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';

const FIELD_TYPE_ICONS: Record<CustomFieldType, React.ReactNode> = {
  select: <Check className="size-4 text-brand-indigo" />,
  multiselect: <CheckCheck className="size-4 text-brand-indigo" />,
  date: <Calendar className="size-4 text-brand-indigo" />,
  people: <Users className="size-4 text-brand-indigo" />,
  text: <Type className="size-4 text-brand-indigo" />,
  number: <Hash className="size-4 text-brand-indigo" />,
  timer: <Clock className="size-4 text-brand-indigo" />,
};

type AddCustomFieldMenuProps = {
  canEdit: boolean;
  isSaving: boolean;
  onCreate: (input: {
    name: string;
    type: CustomFieldType;
    settings: import('@pm/contracts').CustomFieldSettingsDto;
  }) => Promise<void>;
};

export function AddCustomFieldMenu({
  canEdit,
  isSaving,
  onCreate,
}: AddCustomFieldMenuProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedType, setSelectedType] = useState<CustomFieldType | null>(null);

  if (!canEdit) {
    return null;
  }

  return (
    <>
      <Popover open={isMenuOpen} onOpenChange={setIsMenuOpen}>
        <PopoverTrigger
          render={
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              className="size-7"
              aria-label="Añadir campo"
            >
              <Plus className="size-4 text-brand-indigo" />
            </Button>
          }
        />
        <PopoverContent align="end" className="w-64 p-1">
          <p className="px-2 py-1.5 text-xs font-medium text-muted-foreground">
            Tipos de campo
          </p>
          {CUSTOM_FIELD_TYPE_OPTIONS.map((option) => (
            <button
              key={option.type}
              type="button"
              className="flex w-full items-center gap-2 rounded-md px-2 py-2 text-left text-sm hover:bg-muted/70"
              onClick={() => {
                setSelectedType(option.type);
                setIsMenuOpen(false);
                setIsDialogOpen(true);
              }}
            >
              {FIELD_TYPE_ICONS[option.type]}
              <span>{option.label}</span>
            </button>
          ))}
        </PopoverContent>
      </Popover>
      <CreateCustomFieldDialog
        open={isDialogOpen}
        initialType={selectedType}
        isSaving={isSaving}
        onOpenChange={setIsDialogOpen}
        onCreate={async (input) => {
          await onCreate(input);
          setIsDialogOpen(false);
          setSelectedType(null);
        }}
      />
    </>
  );
}
