import type { LucideIcon } from 'lucide-react';
import { Briefcase, CheckSquare, FolderKanban, Home, Inbox, LayoutDashboard, Users } from 'lucide-react';

export type AppNavItem = {
  title: string;
  href: string;
  icon: LucideIcon;
  disabled?: boolean;
};

export const mainNavItems: AppNavItem[] = [
  { title: 'Inicio', href: '/home', icon: Home },
  { title: 'Dashboard', href: '/dashboards', icon: LayoutDashboard },
  { title: 'Equipos', href: '/teams', icon: Users },
  { title: 'Mis tareas', href: '/my-tasks', icon: CheckSquare },
  { title: 'Bandeja', href: '/inbox', icon: Inbox },
  { title: 'Proyectos', href: '/projects', icon: FolderKanban },
  { title: 'Portfolios', href: '/portfolios', icon: Briefcase },
];
