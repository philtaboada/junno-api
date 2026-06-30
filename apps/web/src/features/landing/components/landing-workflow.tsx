import { landingWorkflowSteps } from '@/features/landing/config/landing-content';

export function LandingWorkflow() {
  return (
    <section id="workflow" className="py-20 sm:py-28">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-sm font-medium uppercase tracking-widest text-brand-indigo">
            Cómo funciona
          </p>
          <h2 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">
            De cero a equipo productivo en tres pasos
          </h2>
        </div>
        <ol className="mt-14 grid gap-6 md:grid-cols-3">
          {landingWorkflowSteps.map((step, index) => (
            <li
              key={step.step}
              className="relative rounded-2xl border border-border/80 bg-card p-8"
            >
              {index < landingWorkflowSteps.length - 1 ? (
                <span
                  aria-hidden
                  className="absolute right-0 top-1/2 hidden h-px w-6 translate-x-full bg-border md:block"
                />
              ) : null}
              <p className="text-4xl font-semibold tracking-tight text-brand-coral/30">
                {step.step}
              </p>
              <h3 className="mt-4 text-lg font-semibold tracking-tight">{step.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                {step.description}
              </p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
