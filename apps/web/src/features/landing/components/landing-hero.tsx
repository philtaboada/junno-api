import Link from 'next/link';
import { ArrowRight, CheckCircle2 } from 'lucide-react';
import { buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { LandingProductPreview } from './landing-product-preview';

const heroHighlights = [
  'Sin tarjeta de crédito',
  'Listo en minutos',
  'Diseñado para equipos reales',
] as const;

export function LandingHero() {
  return (
    <section className="landing-mesh-bg relative overflow-hidden">
      <div className="landing-grid-pattern pointer-events-none absolute inset-0 opacity-40" />
      <div className="relative mx-auto max-w-6xl px-4 pb-20 pt-16 sm:px-6 sm:pb-28 sm:pt-20 lg:pb-32 lg:pt-24">
        <div className="mx-auto max-w-3xl text-center">
          <p className="mb-5 inline-flex items-center gap-2 rounded-full border border-brand-indigo/20 bg-brand-indigo-muted/60 px-4 py-1.5 text-sm font-medium text-brand-indigo">
            <span className="size-2 rounded-full bg-brand-coral" />
            Gestión de proyectos, reinventada
          </p>
          <h1 className="text-4xl font-semibold tracking-tight text-foreground sm:text-5xl lg:text-7xl lg:leading-[1.05]">
            Tu equipo alineado.
            <span className="mt-2 block bg-gradient-to-r from-brand-coral via-brand-indigo to-brand-indigo bg-clip-text text-transparent">
              Tus proyectos, bajo control.
            </span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-muted-foreground sm:text-xl">
            Junno une tareas, equipos y plazos en un solo lugar — con la claridad
            de Asana y la velocidad que tu equipo merece.
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
              className={cn(buttonVariants({ variant: 'outline', size: 'lg' }), 'h-11 px-6 text-base')}
            >
              Ya tengo cuenta
            </Link>
          </div>
          <ul className="mt-8 flex flex-wrap items-center justify-center gap-x-6 gap-y-2">
            {heroHighlights.map((item) => (
              <li
                key={item}
                className="inline-flex items-center gap-2 text-sm text-muted-foreground"
              >
                <CheckCircle2 className="size-4 text-brand-indigo" />
                {item}
              </li>
            ))}
          </ul>
        </div>
        <div className="mt-16 sm:mt-20">
          <LandingProductPreview />
        </div>
      </div>
    </section>
  );
}
