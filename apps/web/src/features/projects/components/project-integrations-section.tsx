'use client';

import { useCallback, useEffect, useState } from 'react';
import { Link2, Trash2, Plus } from 'lucide-react';
import { toast } from 'sonner';
import type {
  IntegrationConfigDto,
  IntegrationDetailDto,
  IntegrationEventType,
  IntegrationSummaryDto,
  IntegrationType,
  ProjectDetailDto,
  SlackIntegrationConfigDto,
} from '@pm/contracts';
import { canEditProject } from '@/features/projects/lib/project-access';
import { useAuthStore } from '@/features/auth/hooks/use-auth';
import { ApiError } from '@/lib/api/client';
import {
  completeSlackChannel,
  createProjectIntegration,
  deleteIntegration,
  fetchIntegration,
  fetchIntegrationDeliveryLogs,
  fetchProjectIntegrations,
  startSlackOAuth,
  updateIntegration,
} from '@/lib/api/integrations';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Field, FieldGroup, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';

type ProjectIntegrationsSectionProps = {
  project: ProjectDetailDto;
};

const INTEGRATION_TYPE_LABELS: Record<IntegrationType, string> = {
  webhook: 'Webhook saliente',
  slack: 'Slack',
  whatsapp_kapso: 'WhatsApp (Kapso)',
};

const SELECT_CLASS =
  'h-9 w-full rounded-md border border-input bg-background px-3 text-sm';

function buildIntegrationConfig(
  type: IntegrationType,
  slackMode: 'incoming_webhook' | 'oauth',
  webhookUrl: string,
  webhookSecret: string,
  slackWebhookUrl: string,
  kapsoPhoneNumberId: string,
  kapsoRecipient: string,
): IntegrationConfigDto {
  if (type === 'webhook') {
    return {
      url: webhookUrl.trim(),
      ...(webhookSecret ? { secret: webhookSecret } : {}),
    };
  }
  if (type === 'slack') {
    return slackMode === 'oauth'
      ? { mode: 'oauth' }
      : { mode: 'incoming_webhook', webhookUrl: slackWebhookUrl.trim() };
  }
  return {
    phoneNumberId: kapsoPhoneNumberId.trim(),
    recipientE164: kapsoRecipient.trim(),
  };
}

function getSlackConfig(config: IntegrationConfigDto): SlackIntegrationConfigDto | null {
  if ('mode' in config) {
    return config;
  }
  return null;
}

const EVENT_LABELS: Record<IntegrationEventType, string> = {
  'task.created': 'Tarea creada',
  'task.updated': 'Tarea actualizada',
};

export function ProjectIntegrationsSection({ project }: ProjectIntegrationsSectionProps) {
  const { user } = useAuthStore();
  const canManage = canEditProject(project, user?.id);
  const [integrations, setIntegrations] = useState<IntegrationSummaryDto[]>([]);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<IntegrationDetailDto | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [newType, setNewType] = useState<IntegrationType>('webhook');
  const [newName, setNewName] = useState('');
  const [newEvents, setNewEvents] = useState<IntegrationEventType[]>(['task.created']);
  const [webhookUrl, setWebhookUrl] = useState('');
  const [webhookSecret, setWebhookSecret] = useState('');
  const [slackMode, setSlackMode] = useState<'incoming_webhook' | 'oauth'>('incoming_webhook');
  const [slackWebhookUrl, setSlackWebhookUrl] = useState('');
  const [kapsoPhoneNumberId, setKapsoPhoneNumberId] = useState('');
  const [kapsoRecipient, setKapsoRecipient] = useState('');
  const [slackChannelId, setSlackChannelId] = useState('');

  const loadIntegrations = useCallback(async (): Promise<void> => {
    setIsLoading(true);
    try {
      setIntegrations(await fetchProjectIntegrations(project.id));
    } catch (error) {
      const message =
        error instanceof ApiError ? error.message : 'No se pudieron cargar las integraciones';
      toast.error(message);
      setIntegrations([]);
    } finally {
      setIsLoading(false);
    }
  }, [project.id]);

  useEffect(() => {
    void loadIntegrations();
  }, [loadIntegrations]);

  function toggleEvent(event: IntegrationEventType): void {
    setNewEvents((current) =>
      current.includes(event) ? current.filter((item) => item !== event) : [...current, event],
    );
  }

  async function handleCreate(): Promise<void> {
    if (newName.trim().length < 2 || newEvents.length === 0) {
      return;
    }
    setIsCreating(true);
    try {
      const config = buildIntegrationConfig(
        newType,
        slackMode,
        webhookUrl,
        webhookSecret,
        slackWebhookUrl,
        kapsoPhoneNumberId,
        kapsoRecipient,
      );
      const integration = await createProjectIntegration(project.id, {
        type: newType,
        name: newName.trim(),
        events: newEvents,
        config,
      });
      toast.success(`Integración "${integration.name}" creada`);
      setNewName('');
      setWebhookUrl('');
      setWebhookSecret('');
      setSlackWebhookUrl('');
      setKapsoPhoneNumberId('');
      setKapsoRecipient('');
      await loadIntegrations();
      setExpandedId(integration.id);
      setExpanded(integration);
    } catch (error) {
      const message =
        error instanceof ApiError ? error.message : 'No se pudo crear la integración';
      toast.error(message);
    } finally {
      setIsCreating(false);
    }
  }

  async function handleExpand(integrationId: string): Promise<void> {
    if (expandedId === integrationId) {
      setExpandedId(null);
      setExpanded(null);
      return;
    }
    try {
      const detail = await fetchIntegration(integrationId);
      setExpandedId(integrationId);
      setExpanded(detail);
      const slackConfig = detail.type === 'slack' ? getSlackConfig(detail.config) : null;
      if (slackConfig?.mode === 'oauth') {
        setSlackChannelId(slackConfig.channelId ?? '');
      }
    } catch (error) {
      const message =
        error instanceof ApiError ? error.message : 'No se pudo cargar la integración';
      toast.error(message);
    }
  }

  async function handleDelete(integrationId: string): Promise<void> {
    try {
      await deleteIntegration(integrationId);
      toast.success('Integración eliminada');
      if (expandedId === integrationId) {
        setExpandedId(null);
        setExpanded(null);
      }
      await loadIntegrations();
    } catch (error) {
      const message =
        error instanceof ApiError ? error.message : 'No se pudo eliminar la integración';
      toast.error(message);
    }
  }

  async function handleToggleActive(integration: IntegrationDetailDto): Promise<void> {
    try {
      const updated = await updateIntegration(integration.id, {
        isActive: !integration.isActive,
      });
      setExpanded(updated);
      await loadIntegrations();
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : 'No se pudo actualizar');
    }
  }

  async function handleSlackOAuth(integrationId: string): Promise<void> {
    try {
      const { authorizeUrl } = await startSlackOAuth(integrationId);
      window.location.href = authorizeUrl;
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : 'No se pudo iniciar OAuth');
    }
  }

  async function handleSlackChannelSave(integrationId: string): Promise<void> {
    if (!slackChannelId.trim()) {
      return;
    }
    try {
      const updated = await completeSlackChannel(integrationId, slackChannelId.trim());
      setExpanded(updated);
      toast.success('Canal de Slack configurado');
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : 'No se pudo guardar el canal');
    }
  }

  async function handleShowLogs(integrationId: string): Promise<void> {
    try {
      const logs = await fetchIntegrationDeliveryLogs(integrationId);
      if (logs.length === 0) {
        toast.message('Sin entregas registradas aún');
        return;
      }
      const summary = logs
        .slice(0, 3)
        .map((log) => `${log.eventType}: ${log.status}${log.errorMessage ? ` (${log.errorMessage})` : ''}`)
        .join(' · ');
      toast.message(summary);
    } catch {
      toast.error('No se pudieron cargar los logs');
    }
  }

  if (!canManage) {
    return null;
  }

  return (
    <section className="flex max-w-3xl flex-col gap-4">
      <div className="flex items-center gap-2">
        <Link2 className="size-5 text-muted-foreground" />
        <div>
          <h2 className="text-lg font-semibold">Integraciones</h2>
          <p className="text-sm text-muted-foreground">
            Webhooks, Slack y WhatsApp (Kapso) en eventos de tareas.
          </p>
        </div>
      </div>

      {isLoading ? (
        <p className="text-sm text-muted-foreground">Cargando integraciones…</p>
      ) : integrations.length > 0 ? (
        <ul className="flex flex-col gap-2">
          {integrations.map((integration) => (
            <li
              key={integration.id}
              className="rounded-lg border border-border bg-card p-4"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <button
                  type="button"
                  className="text-left"
                  onClick={() => void handleExpand(integration.id)}
                >
                  <p className="font-medium">{integration.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {INTEGRATION_TYPE_LABELS[integration.type]} ·{' '}
                    {integration.isActive ? 'Activa' : 'Pausada'}
                  </p>
                </button>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => void handleShowLogs(integration.id)}
                  >
                    Logs
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    onClick={() => void handleDelete(integration.id)}
                  >
                    <Trash2 className="size-4" />
                  </Button>
                </div>
              </div>
              {expandedId === integration.id && expanded ? (
                <div className="mt-4 flex flex-col gap-3 border-t border-border pt-4">
                  <p className="text-sm">
                    Eventos:{' '}
                    {expanded.events.map((event) => EVENT_LABELS[event]).join(', ')}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => void handleToggleActive(expanded)}
                    >
                      {expanded.isActive ? 'Pausar' : 'Activar'}
                    </Button>
                    {(() => {
                      const slackConfig =
                        expanded.type === 'slack' ? getSlackConfig(expanded.config) : null;
                      if (!slackConfig || slackConfig.mode !== 'oauth') {
                        return null;
                      }
                      return (
                        <>
                          <Button
                            type="button"
                            size="sm"
                            onClick={() => void handleSlackOAuth(expanded.id)}
                          >
                            Conectar Slack
                          </Button>
                          {slackConfig.teamName ? (
                            <span className="text-sm text-muted-foreground">
                              Equipo: {slackConfig.teamName}
                            </span>
                          ) : null}
                          <FieldGroup className="flex flex-row flex-wrap items-end gap-2">
                            <Field>
                              <FieldLabel>Canal ID</FieldLabel>
                              <Input
                                value={slackChannelId}
                                onChange={(event) => setSlackChannelId(event.target.value)}
                                placeholder="C0123456789"
                              />
                            </Field>
                            <Button
                              type="button"
                              size="sm"
                              onClick={() => void handleSlackChannelSave(expanded.id)}
                            >
                              Guardar canal
                            </Button>
                          </FieldGroup>
                        </>
                      );
                    })()}
                  </div>
                </div>
              ) : null}
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-sm text-muted-foreground">Sin integraciones configuradas.</p>
      )}

      <div className="rounded-lg border border-dashed border-border p-4">
        <p className="mb-3 flex items-center gap-2 text-sm font-medium">
          <Plus className="size-4" />
          Nueva integración
        </p>
        <FieldGroup className="gap-3">
          <Field>
            <FieldLabel>Nombre</FieldLabel>
            <Input value={newName} onChange={(e) => setNewName(e.target.value)} />
          </Field>
          <Field>
            <FieldLabel>Tipo</FieldLabel>
            <select
              className={SELECT_CLASS}
              value={newType}
              onChange={(event) => setNewType(event.target.value as IntegrationType)}
            >
              <option value="webhook">Webhook</option>
              <option value="slack">Slack</option>
              <option value="whatsapp_kapso">WhatsApp (Kapso)</option>
            </select>
          </Field>
          <div className="flex flex-wrap gap-4">
            {(Object.keys(EVENT_LABELS) as IntegrationEventType[]).map((event) => (
              <label key={event} className="flex items-center gap-2 text-sm">
                <Checkbox
                  checked={newEvents.includes(event)}
                  onCheckedChange={() => toggleEvent(event)}
                />
                {EVENT_LABELS[event]}
              </label>
            ))}
          </div>
          {newType === 'webhook' ? (
            <>
              <Field>
                <FieldLabel>URL del webhook</FieldLabel>
                <Input value={webhookUrl} onChange={(e) => setWebhookUrl(e.target.value)} />
              </Field>
              <Field>
                <FieldLabel>Secret (opcional, HMAC SHA-256)</FieldLabel>
                <Input
                  value={webhookSecret}
                  onChange={(e) => setWebhookSecret(e.target.value)}
                  type="password"
                />
              </Field>
            </>
          ) : null}
          {newType === 'slack' ? (
            <>
              <Field>
                <FieldLabel>Modo</FieldLabel>
                <select
                  className={SELECT_CLASS}
                  value={slackMode}
                  onChange={(event) =>
                    setSlackMode(event.target.value as 'incoming_webhook' | 'oauth')
                  }
                >
                  <option value="incoming_webhook">Incoming Webhook URL</option>
                  <option value="oauth">OAuth (bot en canal)</option>
                </select>
              </Field>
              {slackMode === 'incoming_webhook' ? (
                <Field>
                  <FieldLabel>Slack Webhook URL</FieldLabel>
                  <Input
                    value={slackWebhookUrl}
                    onChange={(e) => setSlackWebhookUrl(e.target.value)}
                  />
                </Field>
              ) : null}
            </>
          ) : null}
          {newType === 'whatsapp_kapso' ? (
            <>
              <Field>
                <FieldLabel>Phone Number ID (Meta)</FieldLabel>
                <Input
                  value={kapsoPhoneNumberId}
                  onChange={(e) => setKapsoPhoneNumberId(e.target.value)}
                />
              </Field>
              <Field>
                <FieldLabel>Destinatario E.164</FieldLabel>
                <Input
                  value={kapsoRecipient}
                  onChange={(e) => setKapsoRecipient(e.target.value)}
                  placeholder="+54911..."
                />
              </Field>
            </>
          ) : null}
          <Button
            type="button"
            disabled={isCreating || newName.trim().length < 2 || newEvents.length === 0}
            onClick={() => void handleCreate()}
          >
            Crear integración
          </Button>
        </FieldGroup>
      </div>
    </section>
  );
}