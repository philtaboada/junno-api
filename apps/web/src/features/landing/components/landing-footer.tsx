import Link from 'next/link';
import { AppMark } from '@/components/brand/app-mark';
import { landingNavLinks } from '@/features/landing/config/landing-content';

export function LandingFooter() {
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-border/60 bg-muted/20 py-12">
      <div className="mx-auto flex max-w-6xl flex-col gap-8 px-4 sm:px-6 md:flex-row md:items-start md:justify-between">
        <div className="max-w-sm">
          <AppMark compact />
          <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
            Junno — gestión de proyectos y equipos con la claridad que necesitas
            para avanzar.
          </p>
        </div>
        <nav className="flex flex-wrap gap-x-8 gap-y-4">
          {landingNavLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-sm text-muted-foreground transition-colors hover:text-brand-indigo"
            >
              {link.label}
            </Link>
          ))}
          <Link
            href="/login"
            className="text-sm text-muted-foreground transition-colors hover:text-brand-indigo"
          >
            Iniciar sesión
          </Link>
          <Link
            href="/register"
            className="text-sm text-muted-foreground transition-colors hover:text-brand-indigo"
          >
            Registro
          </Link>
        </nav>
      </div>
      <div className="mx-auto mt-10 max-w-6xl px-4 sm:px-6">
        <p className="text-xs text-muted-foreground">
          © {year} Junno. Todos los derechos reservados.
        </p>
      </div>
    </footer>
  );
}
