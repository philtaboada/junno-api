import type { IntegrationType } from '@pm/contracts';
import { Link2, Webhook } from 'lucide-react';
import { cn } from '@/lib/utils';

type IntegrationBrandIconProps = {
  type: IntegrationType;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
};

type IntegrationMeta = {
  readonly label: string;
  readonly description: string;
  readonly credentialLabel: 'BYOC' | 'Junno';
  readonly shellClass: string;
  readonly iconClass: string;
};

export const INTEGRATION_META: Record<IntegrationType, IntegrationMeta> = {
  webhook: {
    label: 'Webhook',
    description: 'Envía JSON a tu propia URL',
    credentialLabel: 'BYOC',
    shellClass: 'bg-brand-indigo/12 ring-brand-indigo/25',
    iconClass: 'text-brand-indigo',
  },
  slack: {
    label: 'Slack',
    description: 'Notifica en un canal de tu workspace',
    credentialLabel: 'BYOC',
    shellClass: 'bg-[#4A154B]/10 ring-[#4A154B]/20 dark:bg-[#4A154B]/25',
    iconClass: 'text-[#4A154B] dark:text-[#E01E5A]',
  },
  discord: {
    label: 'Discord',
    description: 'Mensajes en servidor o canal',
    credentialLabel: 'BYOC',
    shellClass: 'bg-[#5865F2]/12 ring-[#5865F2]/25',
    iconClass: 'text-[#5865F2]',
  },
  github: {
    label: 'GitHub',
    description: 'Crea un issue al crear tarea (PAT)',
    credentialLabel: 'BYOC',
    shellClass: 'bg-foreground/6 ring-foreground/10',
    iconClass: 'text-foreground',
  },
  whatsapp_kapso: {
    label: 'WhatsApp',
    description: 'Mensajes vía Kapso (Junno)',
    credentialLabel: 'Junno',
    shellClass: 'bg-[#25D366]/12 ring-[#25D366]/25',
    iconClass: 'text-[#128C7E] dark:text-[#25D366]',
  },
};

const SIZE_CLASS = {
  sm: 'size-8 rounded-lg [&_svg]:size-4',
  md: 'size-10 rounded-xl [&_svg]:size-5',
  lg: 'size-12 rounded-xl [&_svg]:size-6',
} as const;

function BrandSvg({ type }: { type: IntegrationType }) {
  switch (type) {
    case 'slack':
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true" fill="currentColor">
          <path d="M5.042 15.165a2.528 2.528 0 0 1-2.52 2.523A2.528 2.528 0 0 1 0 15.165a2.527 2.527 0 0 1 2.522-2.52h2.52v2.52zm1.271 0a2.527 2.527 0 0 1 2.521-2.52 2.527 2.527 0 0 1 2.521 2.52v6.313A2.528 2.528 0 0 1 6.313 24a2.528 2.528 0 0 1-2.52-2.522v-6.313zM6.313 5.042a2.527 2.527 0 0 1-2.52-2.52A2.527 2.527 0 0 1 6.313 0a2.528 2.528 0 0 1 2.521 2.522v2.52H6.313zm0 1.271a2.528 2.528 0 0 1 2.521 2.521 2.528 2.528 0 0 1-2.521 2.521H0a2.527 2.527 0 0 1-2.522-2.521 2.527 2.527 0 0 1 2.522-2.521h6.313zM18.956 8.834a2.528 2.528 0 0 1 2.522-2.521A2.528 2.528 0 0 1 24 8.834a2.527 2.527 0 0 1-2.522 2.521h-2.52V8.834zm-1.27 0a2.527 2.527 0 0 1-2.521 2.521 2.527 2.527 0 0 1-2.521-2.521V2.522A2.528 2.528 0 0 1 17.665 0a2.528 2.528 0 0 1 2.521 2.522v6.312zM17.665 18.956a2.528 2.528 0 0 1 2.521 2.522A2.528 2.528 0 0 1 17.665 24a2.527 2.527 0 0 1-2.521-2.522v-2.52h2.521zm0-1.271a2.527 2.527 0 0 1-2.521-2.521 2.528 2.528 0 0 1 2.521-2.521h6.313A2.527 2.527 0 0 1 24 17.665a2.528 2.528 0 0 1-2.522 2.521h-6.313z" />
        </svg>
      );
    case 'discord':
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true" fill="currentColor">
          <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.445.865-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.028C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.056c2.053 1.508 4.041 2.423 5.993 3.03a.077.077 0 0 0 .084-.028c.462-.63.873-1.295 1.226-1.994a.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128c.126-.094.252-.192.372-.291a.074.074 0 0 1 .078-.01c3.928 1.793 8.18 1.793 12.061 0a.074.074 0 0 1 .078.01c.12.099.246.198.373.292a.077.077 0 0 1-.007.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.363 1.225 1.993a.077.077 0 0 0 .084.028c1.961-.607 3.95-1.522 6.002-3.029a.077.077 0 0 0 .031-.055c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.086-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.211 0 2.176 1.095 2.157 2.419 0 1.333-.956 2.419-2.157 2.419zm7.975 0c-1.183 0-2.157-1.086-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.211 0 2.176 1.095 2.157 2.419 0 1.333-.946 2.419-2.157 2.419z" />
        </svg>
      );
    case 'github':
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true" fill="currentColor">
          <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12" />
        </svg>
      );
    case 'whatsapp_kapso':
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true" fill="currentColor">
          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.435 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413z" />
        </svg>
      );
    case 'webhook':
      return <Webhook className="size-full" strokeWidth={2} />;
    default:
      return <Link2 className="size-full" strokeWidth={2} />;
  }
}

export function IntegrationBrandIcon({
  type,
  size = 'md',
  className,
}: IntegrationBrandIconProps) {
  const meta = INTEGRATION_META[type];
  return (
    <span
      className={cn(
        'inline-flex shrink-0 items-center justify-center ring-1 ring-inset',
        SIZE_CLASS[size],
        meta.shellClass,
        meta.iconClass,
        className,
      )}
    >
      <BrandSvg type={type} />
    </span>
  );
}

export function IntegrationCredentialBadge({
  type,
  className,
}: {
  type: IntegrationType;
  className?: string;
}) {
  const { credentialLabel } = INTEGRATION_META[type];
  const isJunno = credentialLabel === 'Junno';
  return (
    <span
      className={cn(
        'rounded-full px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide',
        isJunno
          ? 'bg-brand-coral/15 text-brand-coral'
          : 'bg-brand-indigo/10 text-brand-indigo',
        className,
      )}
    >
      {credentialLabel}
    </span>
  );
}
