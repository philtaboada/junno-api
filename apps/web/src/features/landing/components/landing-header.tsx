import Link from 'next/link';
import { AppMark } from '@/components/brand/app-mark';
import { buttonVariants } from '@/components/ui/button';
import { landingNavLinks } from '@/features/landing/config/landing-content';

export function LandingHeader() {
  return (
    <header className="sticky top-0 z-50 border-b border-border/60 bg-background/80 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
        <Link href="/" className="shrink-0">
          <AppMark compact />
        </Link>
        <nav className="hidden items-center gap-8 md:flex">
          {landingNavLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-sm font-medium text-muted-foreground transition-colors hover:text-brand-indigo"
            >
              {link.label}
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-2 sm:gap-3">
          <Link href="/login" className={buttonVariants({ variant: 'ghost', size: 'sm' })}>
            Iniciar sesión
          </Link>
          <Link href="/register" className={buttonVariants({ size: 'sm' })}>
            Empezar gratis
          </Link>
        </div>
      </div>
    </header>
  );
}
