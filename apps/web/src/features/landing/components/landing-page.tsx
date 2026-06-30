import { LandingCta } from './landing-cta';
import { LandingFeatures } from './landing-features';
import { LandingFooter } from './landing-footer';
import { LandingHeader } from './landing-header';
import { LandingHero } from './landing-hero';
import { LandingViews } from './landing-views';
import { LandingWorkflow } from './landing-workflow';

export function LandingPage() {
  return (
    <div className="flex min-h-full flex-col">
      <LandingHeader />
      <main className="flex-1">
        <LandingHero />
        <LandingFeatures />
        <LandingViews />
        <LandingWorkflow />
        <LandingCta />
      </main>
      <LandingFooter />
    </div>
  );
}
