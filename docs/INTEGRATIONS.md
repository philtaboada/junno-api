# Integraciones (Fase 3 — Épica 8)

> Webhooks salientes, Slack, Discord, GitHub (BYOC) y WhatsApp vía [Kapso](https://kapso.ai) (global).  
> Patrón de entrega: cola BullMQ (`integrations`), alineado con `automation/`.

## Modelo de credenciales

Junno distingue **dos capas** de configuración:

| Capa | Qué incluye | Dónde vive |
|------|-------------|------------|
| **Plataforma** | Infra compartida de Junno (Redis, URLs públicas, Kapso) | Variables de entorno del API (`.env` / Railway) |
| **Por integración (BYOC)** | Tokens, secrets y URLs que **cada cliente** configura para su Slack, Discord, GitHub o webhook | Columna `project_integrations.config` (JSON en PostgreSQL) |

### BYOC — Bring Your Own Credentials

Slack, Discord y GitHub usan el mismo patrón:

- El **admin del proyecto** crea su propia app en Slack / Discord / GitHub.
- Pega **Client ID**, **Client Secret**, webhook URL, PAT, etc. en la UI de integraciones.
- Junno **no** guarda esas credenciales en `.env` global.
- Tras OAuth, tokens (`botToken`, etc.) también quedan en `config` de esa integración.
- La API **enmascara** secretos en respuestas (`••••••••`); al actualizar sin reescribir el secret se conserva el valor previo.

### WhatsApp (Kapso) — servicio global

WhatsApp es operado por **Junno como plataforma**:

| Dónde | Qué |
|-------|-----|
| `.env` | `KAPSO_API_KEY`, `KAPSO_API_BASE_URL`, `META_GRAPH_VERSION` |
| DB (`config`) | Solo destino por integración: `phoneNumberId`, `recipientE164` |

El cliente **no** aporta API key de Kapso; solo indica a qué número enviar.

### URLs OAuth de plataforma (no son secretos)

El callback OAuth de Slack apunta siempre al API de Junno (misma URL para todos los workspaces):

```
{API_PUBLIC_URL}/api/v1/public/integrations/slack/oauth/callback
```

Cada Slack App del cliente debe registrar **esa** Redirect URL. Consultar:

`GET /integrations/oauth-setup` → `{ "slackRedirectUri": "..." }`

---

## Tipos soportados (v1)

| Tipo | ID | Credenciales |
|------|-----|--------------|
| Webhook saliente | `webhook` | BYOC: `url`, `secret?` en DB |
| Slack | `slack` | BYOC: incoming webhook URL **o** OAuth (`clientId`, `clientSecret`, `botToken`) en DB |
| WhatsApp (Kapso) | `whatsapp_kapso` | Global: Kapso en env; destino en DB |
| Discord | `discord` | BYOC: webhook URL o bot token + channel en DB |
| GitHub | `github` | BYOC: PAT + owner/repo → crea issue al crear tarea |

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
| GET | `/integrations/oauth-setup` | JWT + workspace |
| GET | `/integrations/:id` | JWT + workspace |
| PATCH | `/integrations/:id` | editor+ |
| DELETE | `/integrations/:id` | editor+ |
| GET | `/integrations/:id/delivery-logs` | JWT + workspace |
| POST | `/integrations/:id/slack/oauth/start` | editor+ |
| POST | `/integrations/:id/slack/complete` | editor+ (body: `channelId`) |
| GET | `/public/integrations/slack/oauth/callback` | público (redirect Slack) |
| POST | `/public/integrations/kapso/webhooks` | público (log inbound) |

## Variables de entorno (solo plataforma)

| Variable | Descripción |
|----------|-------------|
| `REDIS_URL` | Cola BullMQ (obligatorio para entregas async) |
| `WEB_APP_URL` | Base para `taskUrl` y redirects post-OAuth hacia la web |
| `API_PUBLIC_URL` | URL pública del API **sin** `/api/v1` (ej. `https://junno-api-production.up.railway.app`) — construye callbacks OAuth |
| `KAPSO_API_KEY` | Header `X-API-Key` hacia Kapso (**WhatsApp global**) |
| `KAPSO_API_BASE_URL` | Default `https://api.kapso.ai` |
| `META_GRAPH_VERSION` | Default `v24.0` |
| `INTEGRATIONS_WORKER_ENABLED` | `false` desactiva worker |

**No usar** `SLACK_CLIENT_ID`, `SLACK_CLIENT_SECRET` ni `SLACK_REDIRECT_URI` — Slack es BYOC en DB.

## Slack (BYOC)

### Modo incoming webhook

Config en DB: `{ "mode": "incoming_webhook", "webhookUrl": "https://hooks.slack.com/..." }`

### Modo OAuth

1. Crear Slack App en [api.slack.com](https://api.slack.com/apps).
2. Registrar Redirect URL = `slackRedirectUri` de `GET /integrations/oauth-setup`.
3. En Junno → integración Slack OAuth → pegar **Client ID** y **Client Secret** (se guardan en DB).
4. **Conectar Slack** → OAuth → elegir **Canal ID**.
5. Tras el callback, `botToken` y `teamName` quedan en `config` (no expuestos en GET).

Scopes requeridos: `chat:write`, `channels:read`.

## Kapso (WhatsApp)

Saliente: `POST {KAPSO_API_BASE_URL}/meta/whatsapp/{META_GRAPH_VERSION}/{phone_number_id}/messages`

Config por integración (DB):

- `phoneNumberId` — ID del número en Meta
- `recipientE164` — destinatario (ej. `+54911...`)

Entrante (debug): configurar en Kapso webhook → `POST /api/v1/public/integrations/kapso/webhooks`. Los payloads se registran en logs del API.

Referencia skills: [gokapso/agent-skills](https://github.com/gokapso/agent-skills) (`integrate-whatsapp`, `observe-whatsapp`).

## Discord (BYOC)

### Modo webhook

1. Discord → canal → **Integraciones** → **Webhooks** → **Nueva webhook**.
2. Copiar la URL (`https://discord.com/api/webhooks/{id}/{token}`).
3. En Junno → integración Discord → pegar URL (se guarda en DB, enmascarada en GET).

Entrega: `POST` con `{ "content": "..." }` (markdown básico).

### Modo bot

1. [Discord Developer Portal](https://discord.com/developers/applications) → crear app → Bot → copiar **token**.
2. Invitar el bot al servidor con permiso `Send Messages` en el canal destino.
3. Copiar **Channel ID** (modo desarrollador → clic derecho en canal).
4. Config en DB: `botToken`, `channelId`.

Entrega: `POST https://discord.com/api/v10/channels/{channelId}/messages` con `Authorization: Bot {token}`.

## GitHub (BYOC — rápido, sin OAuth)

1. En Junno → integración GitHub → **Crear token en GitHub** (abre github.com).
2. Genera un **Personal Access Token** (classic scope `repo` o fine-grained con Issues).
3. Pega el token y pulsa **Cargar repos** — elige el repo en el desplegable (o escribe owner/repo a mano).
4. Activa solo el evento **Tarea creada** — Junno crea un issue por cada tarea nueva.

No hay redirect OAuth ni GitHub App. El token vive en DB (enmascarado en GET).

API entrega: `POST /repos/{owner}/{repo}/issues`  
API listado (solo al configurar): `POST /api/v1/integrations/github/list-repos` con `{ "accessToken": "ghp_..." }` → repos accesibles del token.

Cifrado en reposo (`INTEGRATIONS_ENCRYPTION_KEY`) — pendiente v1.1.

## Modelo de datos

Tablas: `project_integrations`, `integration_delivery_logs`. Ver `docs/DATA-MODEL.md`.

Campo `project_integrations.config` (JSON) — ejemplos:

```json
// Slack OAuth (BYOC)
{
  "mode": "oauth",
  "clientId": "123.456",
  "clientSecret": "...",
  "botToken": "...",
  "teamName": "Mi equipo",
  "channelId": "C0123456789"
}

// WhatsApp (destino; Kapso key en env)
{
  "phoneNumberId": "123456789",
  "recipientE164": "+54911..."
}

// Discord webhook (BYOC)
{
  "mode": "webhook",
  "webhookUrl": "https://discord.com/api/webhooks/..."
}

// GitHub (BYOC — PAT)
{
  "owner": "mi-org",
  "repo": "mi-repo",
  "accessToken": "ghp_..."
}
```

## UI

Configuración de proyecto → sección **Integraciones** (`/projects/:id/settings`).

Slack OAuth redirige a `/integrations/slack/success` o `/error` en la web.
