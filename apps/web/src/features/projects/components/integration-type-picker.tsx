'use client';

import type { ReactNode } from 'react';
import type { IntegrationType } from '@pm/contracts';
import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  INTEGRATION_META,
  IntegrationBrandIcon,
  IntegrationCredentialBadge,
} from '@/features/projects/components/integration-brand-icon';

const INTEGRATION_TYPES: IntegrationType[] = [
  'webhook',
  'slack',
  'discord',
  'github',
  'whatsapp_kapso',
];

type IntegrationTypePickerProps = {
  value: IntegrationType;
  onChange: (type: IntegrationType) => void;
};

export function IntegrationTypePicker({ value, onChange }: IntegrationTypePickerProps) {
  return (
    <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
      {INTEGRATION_TYPES.map((type) => {
        const meta = INTEGRATION_META[type];
        const selected = value === type;
        return (
          <button
            key={type}
            type="button"
            aria-pressed={selected}
            onClick={() => onChange(type)}
            className={cn(
              'group relative flex items-start gap-3 rounded-xl border p-3 text-left transition-all',
              'hover:border-brand-indigo/40 hover:bg-muted/40',
              selected
                ? 'border-brand-indigo bg-brand-indigo/5 shadow-sm ring-1 ring-brand-indigo/20'
                : 'border-border bg-card',
            )}
          >
            <IntegrationBrandIcon type={type} size="md" />
            <div className="min-w-0 flex-1 pt-0.5">
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-medium text-foreground">{meta.label}</span>
                <IntegrationCredentialBadge type={type} />
              </div>
              <p className="mt-0.5 text-xs leading-snug text-muted-foreground">
                {meta.description}
              </p>
            </div>
            {selected ? (
              <span className="absolute right-2.5 top-2.5 flex size-5 items-center justify-center rounded-full bg-brand-indigo text-white">
                <Check className="size-3" strokeWidth={3} />
              </span>
            ) : null}
          </button>
        );
      })}
    </div>
  );
}

type IntegrationModePickerProps<T extends string> = {
  value: T;
  onChange: (value: T) => void;
  options: ReadonlyArray<{ value: T; label: string; hint?: string }>;
};

export function IntegrationModePicker<T extends string>({
  value,
  onChange,
  options,
}: IntegrationModePickerProps<T>) {
  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap gap-2">
        {options.map((option) => {
          const selected = value === option.value;
          return (
            <button
              key={option.value}
              type="button"
              aria-pressed={selected}
              onClick={() => onChange(option.value)}
              className={cn(
                'rounded-lg border px-3 py-2 text-sm font-medium transition-colors',
                selected
                  ? 'border-brand-indigo bg-brand-indigo/10 text-brand-indigo'
                  : 'border-border bg-background text-muted-foreground hover:border-brand-indigo/35 hover:text-foreground',
              )}
            >
              {option.label}
            </button>
          );
        })}
      </div>
      {options.find((option) => option.value === value)?.hint ? (
        <p className="text-xs text-muted-foreground">
          {options.find((option) => option.value === value)?.hint}
        </p>
      ) : null}
    </div>
  );
}

type IntegrationConfigPanelProps = {
  type: IntegrationType;
  title?: string;
  children: ReactNode;
  className?: string;
};

export function IntegrationConfigPanel({
  type,
  title,
  children,
  className,
}: IntegrationConfigPanelProps) {
  const meta = INTEGRATION_META[type];
  return (
    <div
      className={cn(
        'rounded-xl border border-border/80 bg-muted/30 p-4',
        className,
      )}
    >
      <div className="mb-4 flex items-center gap-3 border-b border-border/60 pb-3">
        <IntegrationBrandIcon type={type} size="sm" />
        <div>
          <p className="text-sm font-medium">{title ?? `Configurar ${meta.label}`}</p>
          <p className="text-xs text-muted-foreground">{meta.description}</p>
        </div>
      </div>
      <div className="flex flex-col gap-3">{children}</div>
    </div>
  );
}
