# Automation rules

Reglas **trigger → acción** por proyecto, ejecutadas en background con BullMQ.

## Requisitos

- Redis en marcha (`pnpm docker:up`)
- `REDIS_URL` en `.env` (ver `.env.example`)

Opcional: `AUTOMATION_WORKER_ENABLED=false` desactiva el consumer en la API.

## API

| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/projects/:projectId/automation-rules` | Listar reglas |
| GET | `/projects/:projectId/automation-rules/runs` | Últimas ejecuciones |
| POST | `/projects/:projectId/automation-rules` | Crear regla (admin) |
| PATCH | `/projects/:projectId/automation-rules/:ruleId` | Actualizar |
| DELETE | `/projects/:projectId/automation-rules/:ruleId` | Eliminar |

## Triggers v1

| Trigger | Cuándo se encola |
|---------|------------------|
| `task_completed` | Usuario marca tarea completada |
| `task_assigned` | Cambia el assignee |
| `task_due_changed` | Cambia `due_at` |

## Acciones v1

| Acción | `actionConfig` |
|--------|----------------|
| `assign_user` | `{ userId }` |
| `move_to_section` | `{ sectionId }` |
| `add_comment` | `{ body }` |
| `send_inbox_notification` | `{ recipientUserId, message }` |

## UI

Proyecto → **Configuración** → sección **Reglas de automatización** (solo admin).

## Código

- `apps/api/src/modules/automation/`
- `apps/web/src/features/projects/components/project-automation-rules-section.tsx`

## Migración

```bash
cd apps/api && pnpm migration:up
```
