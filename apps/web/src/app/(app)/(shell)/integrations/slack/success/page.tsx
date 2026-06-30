'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { buttonVariants } from '@/components/ui/button';

export default function SlackOAuthSuccessPage() {
  const searchParams = useSearchParams();
  const integrationId = searchParams.get('integrationId');
  const team = searchParams.get('team');

  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center gap-4 p-6 text-center">
      <h1 className="text-2xl font-semibold">Slack conectado</h1>
      <p className="text-muted-foreground">
        {team ? `Equipo ${team} autorizado.` : 'Autorización completada.'}
      </p>
      <p className="text-sm text-muted-foreground">
        Vuelve a la configuración del proyecto y define el canal ID (ej. C0123456789).
      </p>
      {integrationId ? (
        <Link href="/projects" className={buttonVariants({ variant: 'default' })}>
          Ir a proyectos
        </Link>
      ) : null}
    </div>
  );
}
