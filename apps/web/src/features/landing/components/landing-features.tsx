import { landingFeatures, landingStats } from '@/features/landing/config/landing-content';

export function LandingFeatures() {
  return (
    <section id="features" className="border-t border-border/60 bg-background py-20 sm:py-28">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-sm font-medium uppercase tracking-widest text-brand-indigo">
            Funciones
          </p>
          <h2 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">
            Todo lo que un equipo productivo necesita
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            Desde la primera tarea hasta portfolios complejos — Junno escala contigo
            sin añadir ruido.
          </p>
        </div>
        <dl className="mt-14 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {landingStats.map((stat) => (
            <div
              key={stat.label}
              className="rounded-2xl border border-border/80 bg-card px-6 py-5 text-center"
            >
              <dt className="text-2xl font-semibold tracking-tight text-brand-indigo sm:text-3xl">
                {stat.value}
              </dt>
              <dd className="mt-1 text-sm text-muted-foreground">{stat.label}</dd>
            </div>
          ))}
        </dl>
        <div className="mt-6 grid gap-4 md:grid-cols-4">
          {landingFeatures.map((feature) => (
            <article
              key={feature.title}
              className={`group rounded-2xl border border-border/80 bg-card p-6 transition-colors hover:border-brand-indigo/30 hover:bg-brand-indigo-muted/20 ${feature.className ?? ''}`}
            >
              <div className="mb-4 inline-flex size-10 items-center justify-center rounded-xl bg-brand-indigo-muted text-brand-indigo transition-colors group-hover:bg-brand-indigo group-hover:text-white">
                <feature.icon className="size-5" />
              </div>
              <h3 className="text-base font-semibold tracking-tight">{feature.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                {feature.description}
              </p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
