import type { ProjectColor } from '@pm/contracts';

export type ProjectColorOption = {
  readonly value: ProjectColor;
  readonly label: string;
  readonly swatchClassName: string;
};

export const PROJECT_COLOR_OPTIONS: ProjectColorOption[] = [
  { value: 'coral', label: 'Coral', swatchClassName: 'bg-brand-coral' },
  { value: 'indigo', label: 'Índigo', swatchClassName: 'bg-brand-indigo' },
  { value: 'emerald', label: 'Esmeralda', swatchClassName: 'bg-emerald-500' },
  { value: 'amber', label: 'Ámbar', swatchClassName: 'bg-amber-500' },
  { value: 'rose', label: 'Rosa', swatchClassName: 'bg-rose-500' },
  { value: 'sky', label: 'Cielo', swatchClassName: 'bg-sky-500' },
  { value: 'slate', label: 'Pizarra', swatchClassName: 'bg-slate-500' },
  { value: 'violet', label: 'Violeta', swatchClassName: 'bg-violet-500' },
];

export function getProjectColorOption(
  color: ProjectColor | null | undefined,
): ProjectColorOption {
  const fallback = PROJECT_COLOR_OPTIONS[1];
  if (!color) {
    return fallback;
  }
  return PROJECT_COLOR_OPTIONS.find((option) => option.value === color) ?? fallback;
}

export function getProjectColorSwatchClassName(
  color: ProjectColor | null | undefined,
): string {
  return getProjectColorOption(color).swatchClassName;
}
