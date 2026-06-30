'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { buttonVariants } from '@/components/ui/button';

export default function SlackOAuthErrorPage() {
  const searchParams = useSearchParams();
  const reason = searchParams.get('reason') ?? 'unknown';

  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center gap-4 p-6 text-center">
      <h1 className="text-2xl font-semibold">No se pudo conectar Slack</h1>
      <p className="text-muted-foreground">Motivo: {reason}</p>
      <Link href="/projects" className={buttonVariants({ variant: 'outline' })}>
        Volver a proyectos
      </Link>
    </div>
  );
}
