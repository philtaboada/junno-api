# Arquitectura — Junno

> **Editable por ti.** Cambia este doc cuando quieras otra estructura; luego pide a un agente que alinee el código y `AGENTS.md`.

## Visión

Monorepo con backend NestJS y frontend React, comunicados por REST + WebSocket. PostgreSQL como fuente de verdad relacional; Redis para pub/sub y cache.

## Diagrama lógico

```
┌─────────────┐     REST/WS      ┌─────────────┐
│  apps/web   │ ◄──────────────► │  apps/api   │
│  React SPA  │                  │   NestJS    │
└─────────────┘                  └──────┬──────┘
                                        │
                    ┌───────────────────┼───────────────────┐
                    ▼                   ▼                   ▼
         PostgreSQL (Docker)    Redis (Docker)      Meilisearch (fase 2)
              (datos)            (real-time)         profile `search`
```

Infra local: **`docker compose up -d`** — ver `docs/DOCKER.md`.

## Módulos NestJS (apps/api)

Un módulo por dominio principal:

| Módulo | Responsabilidad |
|--------|-----------------|
| `auth` | Passport + JWT (access/refresh), register/login — ver **`docs/AUTH.md`** |
| `workspaces` | Tenants, membership, `WorkspaceMemberGuard`, header `X-Workspace-Id` |
| `teams` | Teams y membresía |
| `projects` | Projects, sections, members, permisos |
| `tasks` | Tasks, subtasks, memberships (multi-home), followers |
| `comments` | Comentarios y @mentions |
| `notifications` | Inbox, eventos, preferencias |
| `realtime` | Gateway WebSocket |
| `custom-fields` | Definiciones y valores (fase 2) |
| `automation` | Rules engine (fase 3) |

## Layout interno de un módulo NestJS

```
modules/tasks/
├── tasks.module.ts
├── tasks.controller.ts
├── tasks.service.ts
├── entities/
│   └── task.entity.ts
├── dto/
│   ├── create-task.dto.ts
│   └── update-task.dto.ts
└── tasks.service.spec.ts
```

## Frontend (apps/web)

Layout de 5 zonas (como Asana):

1. **Sidebar** — navegación (Home, My Tasks, Inbox, Projects)
2. **Header** — vistas y acciones del contexto
3. **Top bar** — search, create, settings
4. **Main pane** — list / board / calendar / timeline
5. **Task detail pane** — panel derecho slide-over

### Carpetas sugeridas

```
apps/web/src/
├── app/              # rutas (si Next) o router config
├── features/         # por dominio: projects, tasks, inbox...
├── components/       # UI primitivos compartidos
├── hooks/
├── lib/              # api client, socket, utils
└── stores/           # estado global (Zustand/Jotai)
```

## packages/contracts

Tipos y DTOs compartidos entre api y web. **Sin dependencias de Nest ni React.**

## Real-time (MVP)

1. Cliente muta vía REST
2. API persiste en PostgreSQL
3. API emite evento a Redis channel `workspace:{id}`
4. Gateway WS reenvía a clientes suscritos al workspace/project

No replicar LunaDb de Asana en MVP.

## Multitenancy

El **workspace es el tenant**. Spec completa en `docs/AUTH.md`.

- Login → JWT identifica al **usuario**
- Header `X-Workspace-Id` → identifica el **tenant activo**
- `WorkspaceMemberGuard` valida membership antes de cualquier ruta de negocio

## Permisos (dos capas)

**Capa 1 — Workspace** (`workspace_members.role`): `admin` | `member` | `guest`

**Capa 2 — Project** (MVP simplificado): `admin` | `editor` | `commenter` | `viewer`

Regla multi-home: el usuario obtiene el **mayor permiso** entre todos los projects donde vive la task.

## Decisiones cerradas

- [x] **Next.js 16** App Router + React 19 + Tailwind 4 — `apps/web`, **Bun**
- [x] **NestJS 11** — `apps/api`, **pnpm** workspace
- [x] **pnpm** workspaces para `apps/api` + `packages/*`
- [x] Puertos: API **3000**, Web **3001**
- [x] UI web: **shadcn/ui v4** + Tailwind 4 — ver `docs/UI.md`

## Decisiones pendientes

- [ ] Auth: implementar según `docs/AUTH.md`
