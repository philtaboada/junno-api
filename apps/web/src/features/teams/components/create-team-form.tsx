'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Lock } from 'lucide-react';
import { z } from 'zod';
import { toast } from 'sonner';
import type { TeamSummaryDto } from '@pm/contracts';
import {
  CreateTeamMemberPicker,
  type DraftTeamMember,
} from '@/features/teams/components/create-team-member-picker';
import { CreateTeamPreview } from '@/features/teams/components/create-team-preview';
import { useAuthStore } from '@/features/auth/hooks/use-auth';
import {
  ApiError,
  addTeamMember,
  createTeam,
  fetchTeamShareLink,
  inviteTeamMember,
} from '@/lib/api/teams';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

const createTeamSchema = z.object({
  name: z.string().min(2, 'El nombre debe tener al menos 2 caracteres'),
});

type CreateTeamFormValues = z.infer<typeof createTeamSchema>;

type CreateTeamFormProps = {
  onCreated: (team: TeamSummaryDto) => void;
};

export function CreateTeamForm({ onCreated }: CreateTeamFormProps) {
  const { user } = useAuthStore();
  const [formError, setFormError] = useState<string | null>(null);
  const [draftMembers, setDraftMembers] = useState<DraftTeamMember[]>([]);
  const [isSharingLink, setIsSharingLink] = useState(false);
  const form = useForm<CreateTeamFormValues>({
    resolver: zodResolver(createTeamSchema),
    defaultValues: {
      name: '',
    },
  });
  const teamName = form.watch('name');
  const normalizedCurrentEmail = user?.email.trim().toLowerCase() ?? '';
  const additionalDraftMembers = draftMembers.filter((member) => {
    if (member.kind === 'user') {
      return member.userId !== user?.id;
    }
    return member.email !== normalizedCurrentEmail;
  });

  async function addDraftMembersToTeam(
    teamId: string,
    membersToAdd: DraftTeamMember[],
  ): Promise<void> {
    for (const member of membersToAdd) {
      if (member.kind === 'user') {
        await addTeamMember(teamId, { userId: member.userId });
        continue;
      }
      await inviteTeamMember(teamId, { email: member.email });
    }
  }

  async function handleShareLink(): Promise<void> {
    if (!user) {
      return;
    }
    if (teamName.trim().length < 2) {
      toast.error('Escribe el nombre del equipo antes de compartir el enlace');
      return;
    }
    setIsSharingLink(true);
    setFormError(null);
    try {
      const team = await createTeam({ name: teamName.trim() });
      if (additionalDraftMembers.length > 0) {
        await addDraftMembersToTeam(team.id, additionalDraftMembers);
      }
      const response = await fetchTeamShareLink(team.id);
      await navigator.clipboard.writeText(response.inviteUrl);
      toast.success('Enlace del equipo copiado');
      form.reset();
      setDraftMembers([]);
      onCreated(team);
    } catch (error) {
      const message =
        error instanceof ApiError ? error.message : 'No se pudo copiar el enlace';
      toast.error(message);
    } finally {
      setIsSharingLink(false);
    }
  }

  async function handleSubmit(values: CreateTeamFormValues): Promise<void> {
    if (!user) {
      return;
    }
    setFormError(null);
    try {
      const team = await createTeam({ name: values.name });
      if (additionalDraftMembers.length > 0) {
        await addDraftMembersToTeam(team.id, additionalDraftMembers);
      }
      toast.success(`Equipo "${team.name}" creado`);
      form.reset();
      setDraftMembers([]);
      onCreated(team);
    } catch (error) {
      const message =
        error instanceof ApiError ? error.message : 'No se pudo crear el equipo';
      setFormError(message);
    }
  }

  if (!user) {
    return null;
  }

  return (
    <div className="grid gap-8 lg:grid-cols-[minmax(0,26rem)_minmax(0,1fr)] lg:items-start">
      <form onSubmit={form.handleSubmit(handleSubmit)} className="flex flex-col gap-6">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight">Crear un equipo nuevo</h2>
        </div>
        <FieldGroup className="gap-5">
          {formError ? (
            <Alert variant="destructive">
              <AlertDescription>{formError}</AlertDescription>
            </Alert>
          ) : null}
          <Field>
            <FieldLabel htmlFor="team-name">Nombre del equipo</FieldLabel>
            <Input
              id="team-name"
              placeholder="Por ejemplo: «Marketing» o «Diseño»"
              {...form.register('name')}
            />
            <FieldError errors={[form.formState.errors.name]} />
          </Field>
          <Field>
            <FieldLabel htmlFor="team-members">Miembros</FieldLabel>
            <CreateTeamMemberPicker
              members={draftMembers}
              onMembersChange={setDraftMembers}
              excludeUserId={user.id}
              excludeEmail={user.email}
              onShareLink={handleShareLink}
              isSharingLink={isSharingLink}
            />
          </Field>
          <Field>
            <FieldLabel>Privacidad del equipo</FieldLabel>
            <div className="space-y-2">
              <label
                className={cn(
                  'flex cursor-default items-start gap-3 rounded-lg border px-3.5 py-3',
                  'border-brand-indigo/30 bg-brand-indigo-muted/40',
                )}
              >
                <span className="mt-0.5 flex size-4 items-center justify-center rounded-full border-[5px] border-brand-indigo bg-background" />
                <span className="min-w-0 flex-1">
                  <span className="flex items-center gap-2 text-sm font-medium">
                    <Lock className="size-4 text-brand-indigo" />
                    Privado
                  </span>
                  <span className="mt-1 block text-sm text-muted-foreground">
                    Solo miembros invitados del workspace pueden unirse.
                  </span>
                </span>
              </label>
            </div>
          </Field>
          <Button
            type="submit"
            disabled={form.formState.isSubmitting || teamName.trim().length < 2}
            className="w-full"
          >
            {form.formState.isSubmitting ? 'Creando…' : 'Crear equipo'}
          </Button>
        </FieldGroup>
      </form>
      <CreateTeamPreview
        teamName={teamName}
        currentUser={user}
        draftMembers={additionalDraftMembers}
      />
    </div>
  );
}
