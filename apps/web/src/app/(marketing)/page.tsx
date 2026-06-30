import type { Metadata } from 'next';
import { LandingPage } from '@/features/landing/components/landing-page';

export const metadata: Metadata = {
  title: 'Junno — Gestión de proyectos para equipos que avanzan',
  description:
    'Junno une tareas, equipos y plazos en un solo lugar. Vistas lista, tablero y calendario, multi-homing, bandeja en tiempo real y más.',
  openGraph: {
    title: 'Junno — Gestión de proyectos para equipos que avanzan',
    description:
      'Tu equipo alineado. Tus proyectos, bajo control. Empieza gratis en minutos.',
    type: 'website',
  },
};

export default function MarketingHomePage() {
  return <LandingPage />;
}
