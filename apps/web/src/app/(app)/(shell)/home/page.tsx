'use client';

import Link from 'next/link';
import { ChevronRight, FolderKanban, Inbox, CheckSquare, Users } from 'lucide-react';
import { useAuthStore, useActiveWorkspace } from '@/features/auth/hooks/use-auth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function WorkspaceHomePage() {
  const { user } = useAuthStore();
  const activeWorkspace = useActiveWorkspace();

  return (
    <div className="flex flex-1 flex-col gap-6 p-6">
      <div>
        <p className="text-sm text-muted-foreground">Inicio</p>
        <h1 className="text-3xl font-semibold tracking-tight">
          {activeWorkspace?.name}
        </h1>
        <p className="mt-2 text-muted-foreground">
          Hola, {user?.name}. Bienvenido a Junno.
        </p>
      </div>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Link href="/teams" className="group block">
          <Card className="h-full border-border/80 shadow-none transition-colors hover:bg-muted/30">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center justify-between text-base">
                <span className="inline-flex items-center gap-2">
                  <Users className="size-4 text-brand-indigo" />
                  Equipos
                </span>
                <ChevronRight className="size-4 text-brand-indigo opacity-0 transition-opacity group-hover:opacity-100" />
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              Crea equipos, invita miembros y gestiona roles desde la sección Equipos.
            </CardContent>
          </Card>
        </Link>
        <Link href="/projects" className="group block">
          <Card className="h-full border-border/80 shadow-none transition-colors hover:bg-muted/30">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center justify-between text-base">
                <span className="inline-flex items-center gap-2">
                  <FolderKanban className="size-4 text-brand-indigo" />
                  Proyectos
                </span>
                <ChevronRight className="size-4 text-brand-indigo opacity-0 transition-opacity group-hover:opacity-100" />
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              Crea proyectos dentro de tus equipos y organízalos por secciones.
            </CardContent>
          </Card>
        </Link>
        <Link href="/my-tasks" className="group block">
          <Card className="h-full border-border/80 shadow-none transition-colors hover:bg-muted/30">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center justify-between text-base">
                <span className="inline-flex items-center gap-2">
                  <CheckSquare className="size-4 text-brand-indigo" />
                  Mis tareas
                </span>
                <ChevronRight className="size-4 text-brand-indigo opacity-0 transition-opacity group-hover:opacity-100" />
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              Hoy, próximas y más tarde en un solo lugar.
            </CardContent>
          </Card>
        </Link>
        <Link href="/inbox" className="group block">
          <Card className="h-full border-border/80 shadow-none transition-colors hover:bg-muted/30">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center justify-between text-base">
                <span className="inline-flex items-center gap-2">
                  <Inbox className="size-4 text-brand-indigo" />
                  Bandeja
                </span>
                <ChevronRight className="size-4 text-brand-indigo opacity-0 transition-opacity group-hover:opacity-100" />
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              Asignaciones, comentarios y actividad del equipo.
            </CardContent>
          </Card>
        </Link>
      </div>
    </div>
  );
}
