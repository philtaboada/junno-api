'use client';

import { useRouter } from 'next/navigation';
import type { WorkspaceSummaryDto } from '@pm/contracts';
import { setActiveWorkspaceId } from '@/lib/auth/auth-store';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

type WorkspacePickerProps = {
  workspaces: WorkspaceSummaryDto[];
};

export function WorkspacePicker({ workspaces }: WorkspacePickerProps) {
  const router = useRouter();

  function handleSelect(workspaceId: string): void {
    setActiveWorkspaceId(workspaceId);
    router.push('/home');
  }

  return (
    <div className="flex w-full max-w-lg flex-col gap-4">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Elige un workspace</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Selecciona dónde quieres trabajar ahora.
        </p>
      </div>
      <div className="grid gap-3">
        {workspaces.map((workspace) => (
          <Card key={workspace.id} className="border-border/80 shadow-none transition-colors hover:border-brand-indigo/30">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">{workspace.name}</CardTitle>
              <CardDescription>
                {workspace.type === 'personal' ? 'Personal' : 'Organización'} · {workspace.role}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button className="w-full" onClick={() => handleSelect(workspace.id)}>
                Entrar
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
