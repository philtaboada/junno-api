# Modelo de datos

Referencia para implementación con MikroORM/PostgreSQL.

**Auth y multitenancy:** ver `docs/AUTH.md` (spec completa).

## Tenancy (resumen)

- **Tenant = workspace.** Todo dato de negocio lleva `workspace_id`.
- **User** es global; acceso vía `workspace_members`.
- Request autenticado + header `X-Workspace-Id` define el contexto.

```
User N──N Workspace (via workspace_members)
Workspace 1──N Team 1──N Project ...
```

## Entidades auth

| Tabla | Propósito |
|-------|-----------|
| `users` | Cuenta global (email, password_hash, name) |
| `workspaces` | Tenant (`type`: personal \| organization) |
| `workspace_members` | user ↔ workspace + rol (admin, member, guest) |
| `team_notification_preferences` | preferencias de notificación por usuario/equipo |
| `activity_events` | eventos de inbox (ej. `team_member_joined`) |
| `refresh_tokens` | Refresh JWT rotable (hash, expires, revoked) |
| `oauth_accounts` | Google etc. — **fase 2** |

## Entidades core

```
Workspace 1──N Team 1──N Project 1──N Section 1──N TaskMembership N──1 Task
Task 1──N Subtask (Task con parent_task_id)
Task 1──N Comment
Task N──N User (followers)
Project N──N User (project_members con role)
```

## Multi-homing

Tabla `task_memberships`:

| Campo | Tipo | Notas |
|-------|------|-------|
| task_id | uuid | FK |
| project_id | uuid | FK |
| section_id | uuid | FK nullable |
| position | float/int | orden en section |

Una task puede tener **varias filas** en `task_memberships`.

## Task (campos MVP)

- `id`, `workspace_id`, `name`, `description`
- `assignee_id` (nullable)
- `due_at`, `due_has_time`
- `start_at`, `start_has_time` (nullable; rango con `due_at`)
- `priority` (`low` \| `medium` \| `high`, nullable)
- `completed_at` (nullable)
- `parent_task_id` (nullable, subtask)
- `created_by_id`, `created_at`, `updated_at`

## Activity / Inbox (fase 2)

Tabla `activity_events`: eventos para Bandeja — `team_member_joined`, `task_assigned`, `task_comment_added`, `task_completed`, `task_due_changed`, `task_added_to_project`, `automation_notification`.

## Automation rules (fase 3)

| Tabla | Propósito |
|-------|-----------|
| `automation_rules` | Regla por proyecto: trigger + action (JSON config) |
| `automation_runs` | Historial de ejecuciones (success/failed) |

Triggers v1: `task_completed`, `task_assigned`, `task_due_changed`.  
Acciones v1: `assign_user`, `move_to_section`, `add_comment`, `send_inbox_notification`.  
Cola BullMQ (`automation-rules`) con Redis.

## Project templates (fase 3)

| Tabla | Propósito |
|-------|-----------|
| `project_templates` | Plantilla workspace-wide con metadata |
| `project_template_sections` | Secciones copiables |
| `project_template_custom_fields` | Definiciones de campos |
| `project_template_tasks` | Tareas opcionales por sección |

Ver `docs/TEMPLATES.md`.

## Portfolios + goals (fase 3)

| Tabla | Propósito |
|-------|-----------|
| `portfolios` | Agrupación de proyectos por workspace |
| `portfolio_projects` | Proyectos incluidos en un portfolio |
| `goals` | Objetivo con tipo de métrica y target |
| `goal_metric_snapshots` | Historial de valores calculados |

Ver `docs/PORTFOLIOS.md`.

## Dashboards (fase 3)

| Tabla | Propósito |
|-------|-----------|
| `dashboards` | Dashboard por workspace o por team |
| `dashboard_widgets` | Widgets configurables con tipo y config JSON |

Ver `docs/DASHBOARDS.md`.

## Forms (fase 3)

| Tabla | Propósito |
|-------|-----------|
| `project_forms` | Formulario ligado a un proyecto |
| `form_fields` | Campos del formulario con mapeo a task/custom fields |

Ver `docs/FORMS.md`.

## Integraciones (fase 3)

| Tabla | Propósito |
|-------|-----------|
| `project_integrations` | Webhook, Slack o WhatsApp (Kapso) por proyecto |
| `integration_delivery_logs` | Historial de entregas async |

Ver `docs/INTEGRATIONS.md`.

## Custom fields (por proyecto)

- `custom_field_definitions` — definición por proyecto (`type`, `settings` JSON, `name`)
- `custom_field_values` — valor por tarea (`value` JSON)

Tipos soportados: `select`, `multiselect`, `date` (única o rango con `settings.isRange`), `people`, `text`, `number`, `timer`.

`project_list_columns` enlaza columnas builtin (`field_key`) o custom (`custom_field_id`).

## Vista lista de proyecto (columnas)

Tabla `project_list_columns` — configuración por proyecto de columnas visibles en la vista Lista:

| Campo | Tipo | Notas |
|-------|------|-------|
| project_id | uuid | FK |
| field_key | text | `name`, `due_at`, `assignee`, `description`, `priority` (builtin; extensible) |
| position | int | orden de columna |
| visible | boolean | mostrar/ocultar |
| width | int nullable | ancho en px |

Se siembran columnas por defecto al crear el proyecto. Futuras columnas custom enlazarán `field_key` o una FK a `custom_field_definitions`.

**My Tasks columnas custom:** migración `Migration20260619120000` — `custom_field_id` en `my_tasks_list_columns`.

## Attachments

Tabla `task_attachments` (migración `Migration20260621120000`):

| Campo | Tipo | Notas |
|-------|------|-------|
| id | uuid | PK |
| workspace_id | uuid | FK |
| task_id | uuid | FK |
| uploaded_by_id | uuid | FK user |
| file_name | text | nombre original |
| mime_type | text | |
| size_bytes | bigint | |
| storage_key | text | path S3 o local |
| created_at | timestamptz | |

Storage dev: directorio `uploads/` (env `UPLOAD_DIR`). Límite 10 MB por archivo.

## Task dependencies

Tabla `task_dependencies` (migración `Migration20260621120000`):

| Campo | Tipo | Notas |
|-------|------|-------|
| id | uuid | PK |
| workspace_id | uuid | FK |
| predecessor_task_id | uuid | FK — task que bloquea |
| successor_task_id | uuid | FK — task bloqueada |
| type | text | v1: `finish_to_start` |
| created_at | timestamptz | |

Unique `(predecessor_task_id, successor_task_id)`. Validación de ciclos en servicio. Campo `TaskSummaryDto.isBlocked` calculado cuando hay predecesores incompletos.

### Mis tareas (columnas por usuario)

Tabla `my_tasks_list_columns` — misma estructura que `project_list_columns`, scoped por `workspace_id` + `user_id`. Cada usuario personaliza su vista de Mis tareas de forma independiente.
