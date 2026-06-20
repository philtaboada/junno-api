# Integraciones (Fase 3 — Épica 8)

> Webhooks salientes, Slack y WhatsApp vía [Kapso](https://kapso.ai).  
> Patrón de entrega: cola BullMQ (`integrations`), alineado con `automation/`.

## Tipos soportados (v1)

| Tipo | ID | Uso |
|------|-----|-----|
| Webhook saliente | `webhook` | POST JSON firmado opcionalmente (HMAC SHA-256) |
| Slack | `slack` | Incoming Webhook URL o OAuth + `chat.postMessage` |
| WhatsApp (Kapso) | `whatsapp_kapso` | Mensaje texto vía proxy Meta Graph en Kapso |

## Eventos

- `task.created` — al crear tarea (UI o formulario)
- `task.updated` — al actualizar tarea

Payload (`IntegrationEventPayloadDto`):

```json
{
  "id": "uuid",
  "type": "task.created",
  "occurredAt": "2026-06-19T12:00:00.000Z",
  "workspaceId": "...",
  "projectId": "...",
  "projectName": "...",
  "taskId": "...",
  "taskName": "...",
  "taskUrl": "https://app.../projects/{id}?taskId=...",
  "actorUserId": "..."
}
```

Headers webhook (si hay secret): `X-Junno-Signature: sha256=...`, `X-Junno-Event`.

## API

| Método | Ruta | Auth |
|--------|------|------|
| GET | `/projects/:projectId/integrations` | JWT + workspace |
| POST | `/projects/:projectId/integrations` | editor+ |
| GET | `/integrations/:id` | JWT + workspace |
| PATCH | `/integrations/:id` | editor+ |
| DELETE | `/integrations/:id` | editor+ |
| GET | `/integrations/:id/delivery-logs` | JWT + workspace |
| POST | `/integrations/:id/slack/oauth/start` | editor+ |
| POST | `/integrations/:id/slack/complete` | editor+ (body: `channelId`) |
| GET | `/public/integrations/slack/oauth/callback` | público (redirect Slack) |
| POST | `/public/integrations/kapso/webhooks` | público (log inbound) |

## Variables de entorno

| Variable | Descripción |
|----------|-------------|
| `REDIS_URL` | Cola BullMQ (obligatorio para entregas async) |
| `WEB_APP_URL` | Base para `taskUrl` y redirects OAuth |
| `KAPSO_API_KEY` | Header `X-API-Key` hacia Kapso |
| `KAPSO_API_BASE_URL` | Default `https://api.kapso.ai` |
| `META_GRAPH_VERSION` | Default `v24.0` |
| `SLACK_CLIENT_ID` / `SLACK_CLIENT_SECRET` | OAuth Slack |
| `SLACK_REDIRECT_URI` | Callback API (registrar en Slack app) |
| `INTEGRATIONS_WORKER_ENABLED` | `false` desactiva worker |

## Kapso (WhatsApp)

Saliente: `POST {KAPSO_API_BASE_URL}/meta/whatsapp/{META_GRAPH_VERSION}/{phone_number_id}/messages`

Config por integración:

- `phoneNumberId` — ID del número en Meta
- `recipientE164` — destinatario (ej. `+54911...`)

Entrante (debug): configurar en Kapso webhook → `POST /api/v1/public/integrations/kapso/webhooks`. Los payloads se registran en logs del API.

Referencia skills: [gokapso/agent-skills](https://github.com/gokapso/agent-skills) (`integrate-whatsapp`, `observe-whatsapp`).

## Modelo de datos

Tablas: `project_integrations`, `integration_delivery_logs`. Ver `docs/DATA-MODEL.md`.

## UI

Configuración de proyecto → sección **Integraciones** (`/projects/:id/settings`).

Slack OAuth redirige a `/integrations/slack/success` o `/error` en la web.
