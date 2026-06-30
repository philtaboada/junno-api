# Dashboards

Widgets configurables con métricas agregadas sobre tareas del workspace o de un equipo.

## Ámbito

| Ámbito | Descripción |
|--------|-------------|
| **Workspace** | Todas las tareas abiertas del workspace (`GET /dashboards`) |
| **Equipo** | Tareas abiertas en proyectos del equipo (`GET /dashboards?teamId=...`) |

Se crea automáticamente **1 dashboard por workspace** y **1 por equipo** al acceder por primera vez.

## Widgets v1

| Tipo | Descripción |
|------|-------------|
| `overdue_count` | Tareas abiertas con fecha de vencimiento anterior a hoy |
| `tasks_by_assignee` | Conteo de tareas abiertas por persona asignada |
| `custom_field_breakdown` | Desglose por opciones de un campo **select** o **multiselect** |

Config opcional por widget: `projectId` para filtrar a un solo proyecto.

## API

| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/dashboards?teamId=` | Obtener o crear dashboard con datos calculados |
| PATCH | `/dashboards/:id` | Renombrar dashboard |
| POST | `/dashboards/:id/widgets` | Añadir widget |
| PATCH | `/dashboards/:id/widgets/:widgetId` | Actualizar widget |
| DELETE | `/dashboards/:id/widgets/:widgetId` | Eliminar widget |

Permisos: miembro del workspace.

## UI

- **Navegación → Dashboard** — selector workspace/equipo, grid de widgets, añadir/eliminar

## Migración

```bash
cd apps/api && pnpm migration:up
```

Tablas: `dashboards`, `dashboard_widgets`.
