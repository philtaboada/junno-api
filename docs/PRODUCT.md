# Producto — Referencia Asana

Basado en investigación previa. **Editable:** ajusta fases y prioridades aquí.

## MVP (Fase 1) — ✅ cerrada

### Auth + multitenancy (ver `docs/AUTH.md`)

- [x] Registro abierto (sin invitación, sin verificación de email)
- [x] Login email/password (Passport Local + JWT)
- [x] Refresh en cookie httpOnly + access token en memoria
- [x] Logout (revocar refresh + limpiar cookie)
- [x] GET `/me` + listado de workspaces
- [x] Crear workspace adicional
- [x] Header `X-Workspace-Id` + guard de membership
- [x] UI: login, register, workspace switcher
- [ ] (Fase 2.1) Google OAuth + verificación de email

### Resto del MVP

- [x] Teams (lista simple)
- [x] Projects CRUD + sections
- [x] Tasks: nombre, assignee, due date, complete, subtasks (1 nivel)
- [x] Vistas: **List** + **Board**
- [x] Task detail pane (panel derecho)
- [x] My Tasks con secciones Today / Upcoming / Later
- [x] Comentarios en tasks
- [x] Real-time básico (ver cambios sin refresh)

## Core (Fase 2) — ✅ cerrada

> Plan detallado: **`docs/CORE-PHASE2.md`**. Cierre formal: junio 2026.

### Multi-homing (task en N projects)

- [x] Tabla `task_memberships` + acceso backend (mayor permiso entre proyectos)
- [x] API añadir/quitar membership
- [x] DTO con lista de proyectos (`memberships` en `TaskDetailDto`)
- [x] UI: bloque “Proyectos” en task pane + añadir a proyecto

### Inbox + notificaciones

- [x] API `GET /inbox/events` + entidad `activity_events`
- [x] Evento `team_member_joined` (equipos)
- [x] Eventos de tasks (assign, comment, complete, due, multi-home)
- [x] Marcar leído (`PATCH /inbox/events/:id/read`, `POST /inbox/events/read-all`)
- [x] UI `/inbox` + nav Bandeja activo
- [x] Badge unread en sidebar

### Custom fields

- [x] Backend: 7 tipos incl. date range (`isRange`) y timer
- [x] Vista **Lista** de proyecto (columnas, CRUD campos, celdas inline)
- [x] Vista **Board** (badges con valores)
- [x] **Task detail pane** (editar campos)
- [x] **My Tasks** (columnas + valores cross-proyecto)
- [x] Columnas custom en `my_tasks_list_columns` (migración)

### Calendar view

- [x] Tab calendario en proyecto (list/board/calendar)
- [x] Render tasks por `due_at` / rango `start_at`–`due_at`
- [x] Drag para cambiar fecha (editor+)

### Permisos granulares por project

- [x] Roles `admin | editor | commenter | viewer` + API miembros
- [x] Enforcement backend (tasks, comments)
- [x] UI share dialog + settings miembros
- [x] UI: `canComment` / viewer read-only en lista, board y pane

### Attachments

- [x] Modelo + storage local + API upload/list/delete
- [x] UI en task pane

### Dependencies entre tasks

- [x] Modelo `task_dependencies` + validación de ciclos
- [x] API CRUD
- [x] UI “Bloqueada por” / “Bloquea a” en pane
- [x] Indicador `isBlocked` en lista y board

### Search básico

- [x] Búsqueda miembros workspace (auxiliar invitaciones)
- [x] Búsqueda tasks + projects + comments (top bar + `/search`)
- [x] Meilisearch (Fase 3) — ver `docs/SEARCH.md`

## Advanced (Fase 3) — en curso

> Plan detallado: **`docs/PHASE3.md`**

### Timeline / Gantt

- [x] Tab Timeline en proyecto
- [x] Barras por rango `start_at`–`due_at` (28 días, navegación semanal)
- [x] Flechas de dependencias entre tareas
- [x] Drag de barra para reprogramar (editor+)
- [ ] Escala mes / zoom avanzado

### Resto Fase 3

- [x] Automation rules (trigger → action, BullMQ)
- [x] Meilisearch
- [x] Templates de proyecto
- [x] Portfolios + Goals — ver `docs/PORTFOLIOS.md`
- [x] Dashboards — ver `docs/DASHBOARDS.md`
- [x] Forms — ver `docs/FORMS.md`
- [x] Integraciones (Slack, webhooks, WhatsApp Kapso) — ver `docs/INTEGRATIONS.md`

## UX no negociable

- Separar **My Tasks** (hacer) de **Inbox** (saber)
- Misma task, múltiples vistas (list/board/calendar comparten datos)
- Optimistic UI + sync en background
- Task pane abre sin navegar de página
