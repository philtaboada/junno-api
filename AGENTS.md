# Guía para agentes — Junno (clon Asana)

**Lee este archivo primero.** Es la fuente de verdad del proyecto. Si entras a un módulo concreto, lee también el `AGENTS.md` de esa carpeta (cuando exista).

## Qué estamos construyendo

App de gestión de proyectos **muy similar a Asana**: workspaces, teams, projects, tasks, multi-homing, vistas (list/board/calendar/timeline), My Tasks, Inbox, comentarios y tiempo real.

- **Producto:** ver `docs/PRODUCT.md`
- **Arquitectura:** ver `docs/ARCHITECTURE.md`
- **Auth / multitenancy:** ver **`docs/AUTH.md`** ← leer antes de tocar auth
- **Email (Resend):** ver **`docs/EMAIL.md`**
- **Docker (DB, Redis):** ver **`docs/DOCKER.md`**
- **Deploy (Vercel web + Railway API + Supabase + Upstash):** ver **`docs/DEPLOY.md`** y **`docs/RAILWAY.md`**
- **Stack / versiones:** ver **`docs/STACK.md`**
- **UI (shadcn):** ver **`docs/UI.md`**
- **Workflow de agentes:** ver `docs/AGENT-WORKFLOW.md`

## Stack acordado

| Capa | Tecnología |
|------|------------|
| Backend | NestJS **11** + TypeScript + MikroORM — **pnpm** |
| Frontend | Next.js **16** + **shadcn/ui v4** — **Bun** (no npm) |
| DB | PostgreSQL (Docker) |
| Real-time | WebSockets (Socket.io) + Redis (Docker) |
| Search | Meilisearch (fase 2) |
| Cola | BullMQ (notificaciones, reglas — fase 3) |

## Estructura del monorepo (objetivo)

```
project-management/
├── AGENTS.md                 ← entrada para agentes (este archivo)
├── docs/                     ← specs editables por el humano
├── apps/
│   ├── api/                  ← NestJS API
│   └── web/                  ← Next.js (Bun)
├── packages/
│   ├── contracts/            ← DTOs y tipos compartidos
│   └── ui/                   ← componentes compartidos (opcional)
└── .cursor/
    └── rules/                ← reglas Cursor (complemento de AGENTS.md)
```

**No crear carpetas fuera de esta estructura** sin actualizar `docs/ARCHITECTURE.md` y este archivo.

## Reglas de comportamiento (todos los agentes)

1. **Español** en commits, PRs y comunicación con el usuario.
2. **Código en inglés** (nombres, comentarios técnicos, APIs).
3. **No usar npm** — web: **bun**; api/packages: **pnpm** (ver `.cursor/rules/package-managers.mdc`).
4. **Scope mínimo:** no refactorizar ni tocar archivos no relacionados con la tarea.
5. **Convenciones NestJS:** un módulo por dominio, DTOs con class-validator, un service por entidad.
6. **No commitear** salvo que el usuario lo pida explícitamente.
7. **No inventar features** fuera del roadmap en `docs/PRODUCT.md` sin confirmar.
8. **Actualizar docs** si cambias arquitectura, convenciones o estructura de carpetas.

## Orden de lectura por tarea

| Tarea | Leer |
|-------|------|
| Cualquier cosa | `AGENTS.md` → `docs/ARCHITECTURE.md` |
| Backend / API | `.cursor/rules/nestjs-backend.mdc` |
| **Auth / tenants** | **`docs/AUTH.md`** + **`docs/EMAIL.md`** + `.cursor/rules/auth.mdc` |
| Frontend / UI | `docs/UI.md` + `.cursor/rules/ui-design.mdc` + `.cursor/rules/react-frontend.mdc` |
| Modelo de datos | `docs/DATA-MODEL.md` |
| Nueva feature | `docs/PRODUCT.md` (fase correspondiente) + **`docs/CORE-PHASE2.md`** si es Fase 2 |

## Comandos (infra + apps)

```bash
# Infra local (PostgreSQL + Redis)
cp .env.example .env
pnpm docker:up

# API — NestJS 11 (pnpm)
pnpm install              # workspace: api + contracts
pnpm api:dev              # http://localhost:3000/api/v1
pnpm api:build
pnpm api:test

# Web — Next.js 16 (bun)
pnpm web:dev              # http://localhost:3001
pnpm web:build
pnpm web:lint

# Todo
pnpm typecheck
```

## Fases de entrega

Ver detalle en `docs/PRODUCT.md`. Resumen:

1. **MVP:** **auth multitenancy** (Passport+JWT) → workspace → projects → tasks → UI
2. **Core:** multi-homing, comments, inbox, custom fields, calendar, permisos
3. **Advanced:** timeline, rules, portfolios, goals, search, integraciones — ver **`docs/PHASE3.md`**

## Preguntas sin respuesta clara

Si falta una decisión de producto o arquitectura, **pregunta al usuario** antes de implementar. No asumas.
