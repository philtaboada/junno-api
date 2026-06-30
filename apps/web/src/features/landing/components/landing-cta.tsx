import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export function LandingCta() {
  return (
    <section className="py-20 sm:py-28">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="landing-cta-bg relative overflow-hidden rounded-3xl border border-border/60 px-6 py-16 text-center sm:px-12 sm:py-20">
          <div className="landing-grid-pattern pointer-events-none absolute inset-0 opacity-30" />
          <div className="relative">
            <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl lg:text-5xl">
              Empieza a gestionar con claridad
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-lg text-muted-foreground">
              Únete a Junno hoy. Crea tu workspace, invita a tu equipo y deja de
              perseguir actualizaciones en mil sitios.
            </p>
            <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Link
                href="/register"
                className={cn(buttonVariants({ size: 'lg' }), 'h-11 px-6 text-base')}
              >
                Crear cuenta gratis
                <ArrowRight className="size-4" />
              </Link>
              <Link
                href="/login"
                className={cn(
                  buttonVariants({ variant: 'outline', size: 'lg' }),
                  'h-11 border-border/80 bg-background/80 px-6 text-base backdrop-blur-sm',
                )}
              >
                Iniciar sesión
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
