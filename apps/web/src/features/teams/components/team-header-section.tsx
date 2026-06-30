'use client';

import { useState } from 'react';
import { Pencil } from 'lucide-react';
import { toast } from 'sonner';
import type { TeamDetailDto } from '@pm/contracts';
import { ApiError, updateTeam } from '@/lib/api/teams';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

type TeamHeaderSectionProps = {
  team: TeamDetailDto;
  onUpdated: (team: TeamDetailDto) => void;
};

export function TeamHeaderSection({ team, onUpdated }: TeamHeaderSectionProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState(team.name);
  const [description, setDescription] = useState(team.description ?? '');
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function handleCancel(): void {
    setName(team.name);
    setDescription(team.description ?? '');
    setError(null);
    setIsEditing(false);
  }

  async function handleSave(): Promise<void> {
    const trimmedName = name.trim();
    if (trimmedName.length < 2) {
      setError('El nombre debe tener al menos 2 caracteres');
      return;
    }
    setError(null);
    setIsSaving(true);
    try {
      const updatedTeam = await updateTeam(team.id, {
        name: trimmedName,
        description: description.trim() || null,
      });
      onUpdated(updatedTeam);
      setIsEditing(false);
      toast.success('Equipo actualizado');
    } catch (saveError) {
      const message =
        saveError instanceof ApiError
          ? saveError.message
          : 'No se pudo actualizar el equipo';
      setError(message);
    } finally {
      setIsSaving(false);
    }
  }

  if (isEditing) {
    return (
      <div className="flex max-w-2xl flex-col gap-3">
        <div className="flex flex-col gap-2">
          <label htmlFor="team-edit-name" className="text-sm font-medium">
            Nombre del equipo
          </label>
          <Input
            id="team-edit-name"
            value={name}
            onChange={(event) => setName(event.target.value)}
            autoFocus
          />
        </div>
        <div className="flex flex-col gap-2">
          <label htmlFor="team-edit-description" className="text-sm font-medium">
            Descripción
            <span className="ml-1 font-normal text-muted-foreground">(opcional)</span>
          </label>
          <Input
            id="team-edit-description"
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            placeholder="Añade una descripción breve"
          />
        </div>
        {error ? <p className="text-sm text-destructive">{error}</p> : null}
        <div className="flex gap-2">
          <Button
            type="button"
            disabled={isSaving || name.trim().length < 2}
            onClick={() => void handleSave()}
          >
            {isSaving ? 'Guardando…' : 'Guardar'}
          </Button>
          <Button
            type="button"
            variant="outline"
            disabled={isSaving}
            onClick={handleCancel}
          >
            Cancelar
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex max-w-2xl items-start justify-between gap-4">
      <div className="min-w-0">
        <h1 className="text-3xl font-semibold tracking-tight">{team.name}</h1>
        {team.description?.trim() ? (
          <p className="mt-2 text-muted-foreground">{team.description}</p>
        ) : null}
      </div>
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="shrink-0"
        onClick={() => {
          setName(team.name);
          setDescription(team.description ?? '');
          setIsEditing(true);
        }}
      >
        <Pencil className="size-3.5 text-brand-indigo" />
        Editar
      </Button>
    </div>
  );
}
