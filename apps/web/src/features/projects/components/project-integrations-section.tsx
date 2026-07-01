'use client';

import { useCallback, useEffect, useState } from 'react';
import { Hash, ExternalLink, Link2, Trash2, Plus, Sparkles, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import type {
  GitHubRepoOptionDto,
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
  fetchGitHubRepos,
  fetchIntegration,
  fetchIntegrationDeliveryLogs,
  fetchIntegrationOAuthSetup,
  fetchProjectIntegrations,
  startSlackOAuth,
  updateIntegration,
} from '@/lib/api/integrations';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Field, FieldGroup, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import {
  INTEGRATION_META,
  IntegrationBrandIcon,
  IntegrationCredentialBadge,
} from '@/features/projects/components/integration-brand-icon';
import {
  IntegrationConfigPanel,
  IntegrationModePicker,
  IntegrationTypePicker,
} from '@/features/projects/components/integration-type-picker';
import { cn } from '@/lib/utils';

type ProjectIntegrationsSectionProps = {
  project: ProjectDetailDto;
};

const SECRET_MASK = '••••••••';

/** Abre GitHub para crear un PAT con scope repo (sin OAuth). */
const GITHUB_NEW_TOKEN_URL =
  'https://github.com/settings/tokens/new?scopes=repo&description=Junno';

function buildIntegrationConfig(
  type: IntegrationType,
  slackMode: 'incoming_webhook' | 'oauth',
  webhookUrl: string,
  webhookSecret: string,
  slackWebhookUrl: string,
  slackClientId: string,
  slackClientSecret: string,
  discordMode: 'webhook' | 'bot',
  discordWebhookUrl: string,
  discordBotToken: string,
  discordChannelId: string,
  githubOwner: string,
  githubRepo: string,
  githubAccessToken: string,
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
    if (slackMode === 'oauth') {
      return {
        mode: 'oauth',
        clientId: slackClientId.trim(),
        clientSecret: slackClientSecret.trim(),
      };
    }
    return { mode: 'incoming_webhook', webhookUrl: slackWebhookUrl.trim() };
  }
  if (type === 'discord') {
    if (discordMode === 'bot') {
      return {
        mode: 'bot',
        botToken: discordBotToken.trim(),
        channelId: discordChannelId.trim(),
      };
    }
    return { mode: 'webhook', webhookUrl: discordWebhookUrl.trim() };
  }
  if (type === 'github') {
    return {
      owner: githubOwner.trim(),
      repo: githubRepo.trim(),
      accessToken: githubAccessToken.trim(),
    };
  }
  return {
    phoneNumberId: kapsoPhoneNumberId.trim(),
    recipientE164: kapsoRecipient.trim(),
  };
}

function getSlackConfig(config: IntegrationConfigDto): SlackIntegrationConfigDto | null {
  if (
    'mode' in config &&
    (config.mode === 'incoming_webhook' || config.mode === 'oauth')
  ) {
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
  const [slackClientId, setSlackClientId] = useState('');
  const [slackClientSecret, setSlackClientSecret] = useState('');
  const [slackOAuthRedirectUri, setSlackOAuthRedirectUri] = useState<string | null>(null);
  const [discordMode, setDiscordMode] = useState<'webhook' | 'bot'>('webhook');
  const [discordWebhookUrl, setDiscordWebhookUrl] = useState('');
  const [discordBotToken, setDiscordBotToken] = useState('');
  const [discordChannelId, setDiscordChannelId] = useState('');
  const [githubOwner, setGithubOwner] = useState('');
  const [githubRepo, setGithubRepo] = useState('');
  const [githubAccessToken, setGithubAccessToken] = useState('');
  const [githubRepoOptions, setGithubRepoOptions] = useState<GitHubRepoOptionDto[]>([]);
  const [githubSelectedRepo, setGithubSelectedRepo] = useState('');
  const [githubManualRepo, setGithubManualRepo] = useState(false);
  const [githubReposLoading, setGithubReposLoading] = useState(false);
  const [kapsoPhoneNumberId, setKapsoPhoneNumberId] = useState('');
  const [kapsoRecipient, setKapsoRecipient] = useState('');
  const [slackChannelId, setSlackChannelId] = useState('');

  useEffect(() => {
    void fetchIntegrationOAuthSetup()
      .then((setup) => setSlackOAuthRedirectUri(setup.slackRedirectUri))
      .catch(() => setSlackOAuthRedirectUri(null));
  }, []);

  useEffect(() => {
    if (newType === 'github') {
      setNewEvents(['task.created']);
    } else {
      setGithubRepoOptions([]);
      setGithubSelectedRepo('');
      setGithubManualRepo(false);
    }
  }, [newType]);

  async function handleLoadGitHubRepos(): Promise<void> {
    const token = githubAccessToken.trim();
    if (token.length < 10) {
      toast.error('Pega un token de GitHub válido primero');
      return;
    }
    setGithubReposLoading(true);
    try {
      const { repos } = await fetchGitHubRepos(token);
      setGithubRepoOptions(repos);
      setGithubManualRepo(repos.length === 0);
      if (repos.length === 0) {
        toast.message('No se encontraron repos con este token');
        return;
      }
      const currentKey =
        githubOwner.trim() && githubRepo.trim()
          ? `${githubOwner.trim()}/${githubRepo.trim()}`
          : '';
      const match = repos.find((repo) => repo.fullName === currentKey);
      if (match) {
        setGithubSelectedRepo(match.fullName);
        setGithubManualRepo(false);
      } else if (!githubManualRepo) {
        setGithubSelectedRepo('');
        setGithubOwner('');
        setGithubRepo('');
      }
      toast.success(`${repos.length} repos disponibles`);
    } catch (error) {
      const message =
        error instanceof ApiError ? error.message : 'No se pudieron cargar los repos';
      toast.error(message);
      setGithubRepoOptions([]);
    } finally {
      setGithubReposLoading(false);
    }
  }

  function handleGitHubRepoSelect(fullName: string): void {
    setGithubSelectedRepo(fullName);
    if (fullName === '__manual__') {
      setGithubManualRepo(true);
      return;
    }
    setGithubManualRepo(false);
    const selected = githubRepoOptions.find((repo) => repo.fullName === fullName);
    if (selected) {
      setGithubOwner(selected.owner);
      setGithubRepo(selected.name);
    }
  }

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
        slackClientId,
        slackClientSecret,
        discordMode,
        discordWebhookUrl,
        discordBotToken,
        discordChannelId,
        githubOwner,
        githubRepo,
        githubAccessToken,
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
      setSlackClientId('');
      setSlackClientSecret('');
      setDiscordWebhookUrl('');
      setDiscordBotToken('');
      setDiscordChannelId('');
      setGithubOwner('');
      setGithubRepo('');
      setGithubAccessToken('');
      setGithubRepoOptions([]);
      setGithubSelectedRepo('');
      setGithubManualRepo(false);
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
        setSlackClientId(slackConfig.clientId ?? '');
        setSlackClientSecret(
          slackConfig.clientSecret === SECRET_MASK ? SECRET_MASK : (slackConfig.clientSecret ?? ''),
        );
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

  async function handleSlackCredentialsSave(integrationId: string): Promise<void> {
    if (!slackClientId.trim()) {
      toast.error('Client ID requerido');
      return;
    }
    if (!slackClientSecret.trim()) {
      toast.error('Client Secret requerido');
      return;
    }
    try {
      const updated = await updateIntegration(integrationId, {
        config: {
          mode: 'oauth',
          clientId: slackClientId.trim(),
          clientSecret: slackClientSecret.trim(),
        },
      });
      setExpanded(updated);
      toast.success('Credenciales de Slack guardadas');
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : 'No se pudieron guardar las credenciales');
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
        toast.message(
          'Sin entregas aún. ¿Creaste una tarea en este proyecto? ¿Redis/worker activo en la API?',
        );
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
    return (
      <section className="flex max-w-3xl flex-col gap-2">
        <div className="flex items-center gap-2">
          <Link2 className="size-5 text-muted-foreground" />
          <h2 className="text-lg font-semibold">Integraciones</h2>
        </div>
        <p className="text-sm text-muted-foreground">
          Solo los <strong>administradores</strong> del proyecto pueden configurar integraciones.
          Pide a un admin que te dé rol admin o que configure GitHub por ti.
        </p>
      </section>
    );
  }

  const githubBlockedReason =
    newType === 'github'
      ? githubAccessToken.trim().length < 10
        ? 'Pega un Personal Access Token de GitHub (mín. 10 caracteres).'
        : !githubOwner.trim() || !githubRepo.trim()
          ? 'Pulsa «Cargar repos» y elige uno del desplegable, o escribe owner/repo a mano.'
          : null
      : null;

  const createBlockedReason =
    newName.trim().length < 2
      ? 'Escribe un nombre arriba (mínimo 2 caracteres) para activar el botón.'
      : newEvents.length === 0
        ? 'Selecciona al menos un evento.'
        : githubBlockedReason;

  return (
    <section className="flex max-w-3xl flex-col gap-4">
      <div className="flex items-center gap-2">
        <Link2 className="size-5 text-muted-foreground" />
        <div>
          <h2 className="text-lg font-semibold">Integraciones</h2>
          <p className="text-sm text-muted-foreground">
            Webhooks, Slack, Discord, GitHub (BYOC) y WhatsApp Kapso (global).
          </p>
          <p className="text-xs text-muted-foreground">
            Estás en Configuración del proyecto → baja hasta aquí. Tras crear GitHub, crea una
            tarea en este proyecto y usa «Logs» para ver si el issue se envió a GitHub.
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
              className={cn(
                'rounded-xl border bg-card p-4 transition-colors',
                expandedId === integration.id
                  ? 'border-brand-indigo/30 shadow-sm'
                  : 'border-border',
              )}
            >
              <div className="flex flex-wrap items-center justify-between gap-3">
                <button
                  type="button"
                  className="flex min-w-0 flex-1 items-center gap-3 text-left"
                  onClick={() => void handleExpand(integration.id)}
                >
                  <IntegrationBrandIcon type={integration.type} size="md" />
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-medium">{integration.name}</p>
                      <IntegrationCredentialBadge type={integration.type} />
                      <span
                        className={cn(
                          'rounded-full px-2 py-0.5 text-[10px] font-medium',
                          integration.isActive
                            ? 'bg-[#25D366]/15 text-[#128C7E] dark:text-[#25D366]'
                            : 'bg-muted text-muted-foreground',
                        )}
                      >
                        {integration.isActive ? 'Activa' : 'Pausada'}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {INTEGRATION_META[integration.type].label}
                    </p>
                  </div>
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
                        <div className="mt-2 w-full rounded-xl border border-[#4A154B]/20 bg-gradient-to-br from-[#4A154B]/8 to-transparent p-4">
                          <div className="mb-4 flex items-center gap-3">
                            <IntegrationBrandIcon type="slack" size="md" />
                            <div>
                              <p className="text-sm font-semibold">Conectar tu workspace de Slack</p>
                              <p className="text-xs text-muted-foreground">
                                OAuth con tu propia Slack App (BYOC)
                              </p>
                            </div>
                          </div>
                          {slackOAuthRedirectUri ? (
                            <p className="mb-3 rounded-lg border border-border/60 bg-background/80 px-3 py-2 text-xs text-muted-foreground">
                              Redirect URL en tu Slack App:{' '}
                              <code className="break-all text-foreground">{slackOAuthRedirectUri}</code>
                            </p>
                          ) : null}
                          <FieldGroup className="grid gap-3 sm:grid-cols-2">
                            <Field>
                              <FieldLabel>Client ID</FieldLabel>
                              <Input
                                value={slackClientId}
                                onChange={(event) => setSlackClientId(event.target.value)}
                                placeholder="123456789.987654321"
                              />
                            </Field>
                            <Field>
                              <FieldLabel>Client Secret</FieldLabel>
                              <Input
                                value={slackClientSecret}
                                onChange={(event) => setSlackClientSecret(event.target.value)}
                                type="password"
                                placeholder="••••••••"
                              />
                            </Field>
                          </FieldGroup>
                          <div className="mt-3 flex flex-wrap gap-2">
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => void handleSlackCredentialsSave(expanded.id)}
                            >
                              Guardar credenciales
                            </Button>
                            <Button
                              type="button"
                              size="sm"
                              className="bg-[#4A154B] text-white hover:bg-[#4A154B]/90"
                              onClick={() => void handleSlackOAuth(expanded.id)}
                            >
                              Conectar Slack
                            </Button>
                          </div>
                          {slackConfig.teamName ? (
                            <p className="mt-3 flex items-center gap-2 text-sm text-muted-foreground">
                              <Sparkles className="size-4 text-[#E01E5A]" />
                              Equipo conectado:{' '}
                              <span className="font-medium text-foreground">{slackConfig.teamName}</span>
                            </p>
                          ) : null}
                          <div className="mt-4 rounded-lg border border-[#4A154B]/15 bg-background/60 p-3">
                            <p className="mb-2 text-xs font-medium text-foreground">
                              Canal de destino
                            </p>
                            <FieldGroup className="flex flex-row flex-wrap items-end gap-2">
                              <Field className="min-w-[200px] flex-1">
                                <FieldLabel>Canal ID</FieldLabel>
                                <div className="relative">
                                  <Hash className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                                  <Input
                                    value={slackChannelId}
                                    onChange={(event) => setSlackChannelId(event.target.value)}
                                    placeholder="C0123456789"
                                    className="pl-9 font-mono text-sm"
                                  />
                                </div>
                              </Field>
                              <Button
                                type="button"
                                size="sm"
                                onClick={() => void handleSlackChannelSave(expanded.id)}
                              >
                                Guardar canal
                              </Button>
                            </FieldGroup>
                          </div>
                        </div>
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

      <div className="rounded-xl border border-dashed border-brand-indigo/25 bg-muted/20 p-5">
        <p className="mb-1 flex items-center gap-2 text-sm font-semibold">
          <Plus className="size-4 text-brand-indigo" />
          Nueva integración
        </p>
        <p className="mb-4 text-xs text-muted-foreground">
          Elige un canal y configura las credenciales de tu cuenta.
        </p>
        <FieldGroup className="gap-5">
          <Field>
            <FieldLabel>Nombre</FieldLabel>
            <Input
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="Alertas del equipo"
            />
          </Field>
          <Field>
            <FieldLabel>Canal</FieldLabel>
            <IntegrationTypePicker value={newType} onChange={setNewType} />
          </Field>
          <Field>
            <FieldLabel>Eventos</FieldLabel>
            <div className="flex flex-wrap gap-3 rounded-lg border border-border bg-card p-3">
              {(Object.keys(EVENT_LABELS) as IntegrationEventType[]).map((event) => {
                const githubLocked = newType === 'github' && event === 'task.updated';
                return (
                  <label
                    key={event}
                    className={cn(
                      'flex items-center gap-2 text-sm',
                      githubLocked && 'cursor-not-allowed opacity-50',
                    )}
                  >
                    <Checkbox
                      checked={newEvents.includes(event)}
                      disabled={githubLocked}
                      onCheckedChange={() => toggleEvent(event)}
                    />
                    {EVENT_LABELS[event]}
                  </label>
                );
              })}
            </div>
            {newType === 'github' ? (
              <p className="text-xs text-muted-foreground">
                GitHub solo dispara al crear tarea (un issue por tarea).
              </p>
            ) : null}
          </Field>
          {newType === 'webhook' ? (
            <IntegrationConfigPanel type="webhook">
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
            </IntegrationConfigPanel>
          ) : null}
          {newType === 'slack' ? (
            <IntegrationConfigPanel type="slack">
              <Field>
                <FieldLabel>Modo</FieldLabel>
                <IntegrationModePicker
                  value={slackMode}
                  onChange={setSlackMode}
                  options={[
                    {
                      value: 'incoming_webhook' as const,
                      label: 'Webhook URL',
                      hint: 'Pega la URL de Incoming Webhooks de Slack.',
                    },
                    {
                      value: 'oauth' as const,
                      label: 'OAuth + bot',
                      hint: 'Tu Slack App; tras crear, conecta el canal en la integración.',
                    },
                  ]}
                />
              </Field>
              {slackMode === 'incoming_webhook' ? (
                <Field>
                  <FieldLabel>Slack Webhook URL</FieldLabel>
                  <Input
                    value={slackWebhookUrl}
                    onChange={(e) => setSlackWebhookUrl(e.target.value)}
                    placeholder="https://hooks.slack.com/services/..."
                  />
                </Field>
              ) : (
                <>
                  {slackOAuthRedirectUri ? (
                    <p className="rounded-lg border border-border/60 bg-background px-3 py-2 text-xs text-muted-foreground">
                      Redirect URL en tu Slack App:{' '}
                      <code className="break-all text-foreground">{slackOAuthRedirectUri}</code>
                    </p>
                  ) : null}
                  <FieldGroup className="grid gap-3 sm:grid-cols-2">
                    <Field>
                      <FieldLabel>Client ID</FieldLabel>
                      <Input
                        value={slackClientId}
                        onChange={(e) => setSlackClientId(e.target.value)}
                        placeholder="123456789.987654321"
                      />
                    </Field>
                    <Field>
                      <FieldLabel>Client Secret</FieldLabel>
                      <Input
                        value={slackClientSecret}
                        onChange={(e) => setSlackClientSecret(e.target.value)}
                        type="password"
                      />
                    </Field>
                  </FieldGroup>
                </>
              )}
            </IntegrationConfigPanel>
          ) : null}
          {newType === 'discord' ? (
            <IntegrationConfigPanel type="discord">
              <Field>
                <FieldLabel>Modo</FieldLabel>
                <IntegrationModePicker
                  value={discordMode}
                  onChange={setDiscordMode}
                  options={[
                    {
                      value: 'webhook' as const,
                      label: 'Webhook de canal',
                      hint: 'Integraciones → Webhooks en Discord.',
                    },
                    {
                      value: 'bot' as const,
                      label: 'Bot + canal',
                      hint: 'Token del bot y Channel ID (snowflake).',
                    },
                  ]}
                />
              </Field>
              {discordMode === 'webhook' ? (
                <Field>
                  <FieldLabel>Webhook URL</FieldLabel>
                  <Input
                    value={discordWebhookUrl}
                    onChange={(e) => setDiscordWebhookUrl(e.target.value)}
                    placeholder="https://discord.com/api/webhooks/..."
                  />
                </Field>
              ) : (
                <FieldGroup className="grid gap-3 sm:grid-cols-2">
                  <Field>
                    <FieldLabel>Bot Token</FieldLabel>
                    <Input
                      value={discordBotToken}
                      onChange={(e) => setDiscordBotToken(e.target.value)}
                      type="password"
                    />
                  </Field>
                  <Field>
                    <FieldLabel>Channel ID</FieldLabel>
                    <div className="relative">
                      <Hash className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        value={discordChannelId}
                        onChange={(e) => setDiscordChannelId(e.target.value)}
                        placeholder="1234567890123456789"
                        className="pl-9 font-mono text-sm"
                      />
                    </div>
                  </Field>
                </FieldGroup>
              )}
            </IntegrationConfigPanel>
          ) : null}
          {newType === 'github' ? (
            <IntegrationConfigPanel type="github">
              <p className="text-xs text-muted-foreground">
                Sin OAuth: crea un token en GitHub, pégalo aquí y elige el repo. Cada tarea nueva
                genera un issue en ese repo.
              </p>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="w-fit gap-2"
                onClick={() => window.open(GITHUB_NEW_TOKEN_URL, '_blank', 'noopener,noreferrer')}
              >
                <ExternalLink className="size-4" />
                Crear token en GitHub
              </Button>
              <Field>
                <FieldLabel>Personal Access Token</FieldLabel>
                <Input
                  value={githubAccessToken}
                  onChange={(e) => {
                    setGithubAccessToken(e.target.value);
                    setGithubRepoOptions([]);
                    setGithubSelectedRepo('');
                    setGithubManualRepo(false);
                  }}
                  type="password"
                  placeholder="ghp_..."
                />
              </Field>
              <div className="flex flex-wrap items-center gap-2">
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  disabled={githubReposLoading || githubAccessToken.trim().length < 10}
                  onClick={() => void handleLoadGitHubRepos()}
                >
                  {githubReposLoading ? (
                    <>
                      <Loader2 className="size-4 animate-spin" />
                      Cargando repos…
                    </>
                  ) : (
                    'Cargar repos'
                  )}
                </Button>
                {githubRepoOptions.length > 0 ? (
                  <span className="text-xs text-muted-foreground">
                    {githubRepoOptions.length} repos con acceso
                  </span>
                ) : null}
              </div>
              {githubRepoOptions.length > 0 && !githubManualRepo ? (
                <Field>
                  <FieldLabel>Repositorio</FieldLabel>
                  <select
                    value={githubSelectedRepo}
                    onChange={(e) => handleGitHubRepoSelect(e.target.value)}
                    className="border-input bg-background ring-offset-background focus-visible:ring-ring flex h-9 w-full rounded-md border px-3 py-1 text-sm shadow-xs focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none"
                  >
                    <option value="">Selecciona un repo…</option>
                    {githubRepoOptions.map((repo) => (
                      <option key={repo.fullName} value={repo.fullName}>
                        {repo.fullName}
                        {repo.isPrivate ? ' (privado)' : ''}
                      </option>
                    ))}
                    <option value="__manual__">Otro — escribir owner/repo manualmente</option>
                  </select>
                </Field>
              ) : null}
              {githubManualRepo || githubRepoOptions.length === 0 ? (
                <FieldGroup className="grid gap-3 sm:grid-cols-2">
                  <Field>
                    <FieldLabel>Owner</FieldLabel>
                    <Input
                      value={githubOwner}
                      onChange={(e) => setGithubOwner(e.target.value)}
                      placeholder="mi-org"
                    />
                  </Field>
                  <Field>
                    <FieldLabel>Repo</FieldLabel>
                    <Input
                      value={githubRepo}
                      onChange={(e) => setGithubRepo(e.target.value)}
                      placeholder="mi-repo"
                    />
                  </Field>
                </FieldGroup>
              ) : null}
            </IntegrationConfigPanel>
          ) : null}
          {newType === 'whatsapp_kapso' ? (
            <IntegrationConfigPanel type="whatsapp_kapso" title="WhatsApp vía Junno">
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
            </IntegrationConfigPanel>
          ) : null}
          <Button
            type="button"
            className="w-full sm:w-auto"
            disabled={
              isCreating ||
              newName.trim().length < 2 ||
              newEvents.length === 0 ||
              Boolean(githubBlockedReason)
            }
            onClick={() => void handleCreate()}
          >
            Crear integración
          </Button>
          {createBlockedReason && !isCreating ? (
            <p className="text-xs text-muted-foreground">{createBlockedReason}</p>
          ) : null}
        </FieldGroup>
      </div>
    </section>
  );
}