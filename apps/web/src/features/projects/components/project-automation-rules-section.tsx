'use client';

import { useCallback, useEffect, useState, type Dispatch, type SetStateAction } from 'react';
import { Plus, Trash2, Zap } from 'lucide-react';
import { toast } from 'sonner';
import type {
  AutomationActionType,
  AutomationRuleDto,
  AutomationRunDto,
  AutomationTriggerType,
  ProjectDetailDto,
} from '@pm/contracts';
import {
  AUTOMATION_ACTION_LABELS,
  AUTOMATION_TRIGGER_LABELS,
  describeAutomationRule,
} from '@/features/projects/lib/automation-labels';
import { canEditProject } from '@/features/projects/lib/project-access';
import { useAuthStore } from '@/features/auth/hooks/use-auth';
import {
  createAutomationRule,
  deleteAutomationRule,
  fetchAutomationRules,
  fetchAutomationRuns,
  updateAutomationRule,
} from '@/lib/api/automation-rules';
import { ApiError } from '@/lib/api/client';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

type ProjectAutomationRulesSectionProps = {
  project: ProjectDetailDto;
};

type RuleFormState = {
  name: string;
  triggerType: AutomationTriggerType;
  actionType: AutomationActionType;
  userId: string;
  sectionId: string;
  commentBody: string;
  recipientUserId: string;
  message: string;
};

const DEFAULT_FORM: RuleFormState = {
  name: '',
  triggerType: 'task_completed',
  actionType: 'assign_user',
  userId: '',
  sectionId: '',
  commentBody: '',
  recipientUserId: '',
  message: '',
};

export function ProjectAutomationRulesSection({
  project,
}: ProjectAutomationRulesSectionProps) {
  const { user } = useAuthStore();
  const canManage = canEditProject(project, user?.id);
  const [rules, setRules] = useState<AutomationRuleDto[]>([]);
  const [runs, setRuns] = useState<AutomationRunDto[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [form, setForm] = useState<RuleFormState>(DEFAULT_FORM);

  const loadRules = useCallback(async (): Promise<void> => {
    setIsLoading(true);
    try {
      const [nextRules, nextRuns] = await Promise.all([
        fetchAutomationRules(project.id),
        fetchAutomationRuns(project.id),
      ]);
      setRules(nextRules);
      setRuns(nextRuns);
    } catch (error) {
      const message =
        error instanceof ApiError ? error.message : 'No se pudieron cargar las reglas';
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  }, [project.id]);

  useEffect(() => {
    void loadRules();
  }, [loadRules]);

  if (!canManage) {
    return null;
  }

  async function handleToggleEnabled(
    rule: AutomationRuleDto,
    enabled: boolean,
  ): Promise<void> {
    try {
      const updated = await updateAutomationRule(project.id, rule.id, { enabled });
      setRules((current) =>
        current.map((item) => (item.id === updated.id ? updated : item)),
      );
    } catch (error) {
      const message =
        error instanceof ApiError ? error.message : 'No se pudo actualizar la regla';
      toast.error(message);
    }
  }

  async function handleDelete(ruleId: string): Promise<void> {
    try {
      await deleteAutomationRule(project.id, ruleId);
      setRules((current) => current.filter((item) => item.id !== ruleId));
      toast.success('Regla eliminada');
    } catch (error) {
      const message =
        error instanceof ApiError ? error.message : 'No se pudo eliminar la regla';
      toast.error(message);
    }
  }

  async function handleCreate(): Promise<void> {
    if (form.name.trim().length === 0) {
      toast.error('El nombre es obligatorio');
      return;
    }
    setIsSaving(true);
    try {
      const actionConfig = buildActionConfig(form);
      const created = await createAutomationRule(project.id, {
        name: form.name.trim(),
        triggerType: form.triggerType,
        actionType: form.actionType,
        actionConfig,
      });
      setRules((current) => [...current, created]);
      setForm(DEFAULT_FORM);
      setIsDialogOpen(false);
      toast.success('Regla creada');
    } catch (error) {
      const message =
        error instanceof ApiError ? error.message : 'No se pudo crear la regla';
      toast.error(message);
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <section className="flex max-w-2xl flex-col gap-3">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Zap className="size-4 text-brand-indigo" />
          <h2 className="text-lg font-semibold tracking-tight">Reglas de automatización</h2>
        </div>
        <Button type="button" size="sm" onClick={() => setIsDialogOpen(true)}>
          <Plus className="size-3.5" />
          Nueva regla
        </Button>
      </div>
      <p className="text-sm text-muted-foreground">
        Ejecuta acciones en segundo plano cuando ocurre un evento en este proyecto.
      </p>
      <div className="overflow-hidden rounded-xl border border-border/80 bg-card">
        {isLoading ? (
          <p className="px-4 py-6 text-sm text-muted-foreground">Cargando reglas…</p>
        ) : rules.length === 0 ? (
          <p className="px-4 py-6 text-sm text-muted-foreground">
            No hay reglas todavía. Crea una para automatizar tareas repetitivas.
          </p>
        ) : (
          <ul className="divide-y divide-border/60">
            {rules.map((rule) => (
              <li
                key={rule.id}
                className="flex items-start gap-3 px-4 py-3"
              >
                <Checkbox
                  checked={rule.enabled}
                  onCheckedChange={(checked) =>
                    void handleToggleEnabled(rule, checked === true)
                  }
                  aria-label={`Activar regla ${rule.name}`}
                />
                <div className="min-w-0 flex-1">
                  <p className="font-medium">{rule.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {describeAutomationRule(rule.triggerType, rule.actionType)}
                  </p>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  onClick={() => void handleDelete(rule.id)}
                  aria-label={`Eliminar regla ${rule.name}`}
                >
                  <Trash2 className="size-4 text-destructive" />
                </Button>
              </li>
            ))}
          </ul>
        )}
      </div>
      {runs.length > 0 ? (
        <div className="rounded-xl border border-border/80 bg-muted/20 p-4">
          <p className="mb-2 text-sm font-medium">Ejecuciones recientes</p>
          <ul className="space-y-2 text-sm text-muted-foreground">
            {runs.slice(0, 5).map((run) => (
              <li key={run.id}>
                {run.ruleName} —{' '}
                <span
                  className={
                    run.status === 'success'
                      ? 'text-emerald-600'
                      : run.status === 'failed'
                        ? 'text-destructive'
                        : 'text-muted-foreground'
                  }
                >
                  {run.status === 'success'
                    ? 'ok'
                    : run.status === 'failed'
                      ? 'error'
                      : run.status}
                </span>
                {run.errorMessage ? ` (${run.errorMessage})` : null}
              </li>
            ))}
          </ul>
        </div>
      ) : null}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Nueva regla</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="rule-name">Nombre</Label>
              <Input
                id="rule-name"
                value={form.name}
                onChange={(event) =>
                  setForm((current) => ({ ...current, name: event.target.value }))
                }
                placeholder="Ej. Asignar al completar"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="rule-trigger">Cuando</Label>
              <select
                id="rule-trigger"
                className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
                value={form.triggerType}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    triggerType: event.target.value as AutomationTriggerType,
                  }))
                }
              >
                {Object.entries(AUTOMATION_TRIGGER_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="rule-action">Entonces</Label>
              <select
                id="rule-action"
                className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
                value={form.actionType}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    actionType: event.target.value as AutomationActionType,
                  }))
                }
              >
                {Object.entries(AUTOMATION_ACTION_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </div>
            <ActionConfigFields project={project} form={form} setForm={setForm} />
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsDialogOpen(false)}
              disabled={isSaving}
            >
              Cancelar
            </Button>
            <Button type="button" onClick={() => void handleCreate()} disabled={isSaving}>
              {isSaving ? 'Guardando…' : 'Crear regla'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </section>
  );
}

type ActionConfigFieldsProps = {
  project: ProjectDetailDto;
  form: RuleFormState;
  setForm: Dispatch<SetStateAction<RuleFormState>>;
};

function ActionConfigFields({
  project,
  form,
  setForm,
}: ActionConfigFieldsProps): import('react').ReactElement | null {
  if (form.actionType === 'assign_user') {
    return (
      <div className="grid gap-2">
        <Label htmlFor="rule-user">Usuario</Label>
        <select
          id="rule-user"
          className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
          value={form.userId}
          onChange={(event) =>
            setForm((current) => ({ ...current, userId: event.target.value }))
          }
        >
          <option value="">Seleccionar miembro</option>
          {project.members.map((member) => (
            <option key={member.userId} value={member.userId}>
              {member.name}
            </option>
          ))}
        </select>
      </div>
    );
  }
  if (form.actionType === 'move_to_section') {
    return (
      <div className="grid gap-2">
        <Label htmlFor="rule-section">Sección</Label>
        <select
          id="rule-section"
          className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
          value={form.sectionId}
          onChange={(event) =>
            setForm((current) => ({ ...current, sectionId: event.target.value }))
          }
        >
          <option value="">Seleccionar sección</option>
          {project.sections.map((section) => (
            <option key={section.id} value={section.id}>
              {section.name}
            </option>
          ))}
        </select>
      </div>
    );
  }
  if (form.actionType === 'add_comment') {
    return (
      <div className="grid gap-2">
        <Label htmlFor="rule-comment">Comentario</Label>
        <textarea
          id="rule-comment"
          className="min-h-24 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
          value={form.commentBody}
          onChange={(event) =>
            setForm((current) => ({ ...current, commentBody: event.target.value }))
          }
          placeholder="Texto del comentario automático"
        />
      </div>
    );
  }
  return (
    <>
      <div className="grid gap-2">
        <Label htmlFor="rule-recipient">Destinatario</Label>
        <select
          id="rule-recipient"
          className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
          value={form.recipientUserId}
          onChange={(event) =>
            setForm((current) => ({ ...current, recipientUserId: event.target.value }))
          }
        >
          <option value="">Seleccionar miembro</option>
          {project.members.map((member) => (
            <option key={member.userId} value={member.userId}>
              {member.name}
            </option>
          ))}
        </select>
      </div>
      <div className="grid gap-2">
        <Label htmlFor="rule-message">Mensaje</Label>
        <textarea
          id="rule-message"
          className="min-h-20 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
          value={form.message}
          onChange={(event) =>
            setForm((current) => ({ ...current, message: event.target.value }))
          }
          placeholder="Mensaje en la bandeja"
        />
      </div>
    </>
  );
}

function buildActionConfig(form: RuleFormState): Record<string, unknown> {
  switch (form.actionType) {
    case 'assign_user':
      return { userId: form.userId };
    case 'move_to_section':
      return { sectionId: form.sectionId };
    case 'add_comment':
      return { body: form.commentBody };
    case 'send_inbox_notification':
      return {
        recipientUserId: form.recipientUserId,
        message: form.message,
      };
    default:
      return {};
  }
}
