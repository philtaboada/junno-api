# Portfolios y Goals

Agrupar proyectos en portfolios y medir progreso con goals basados en métricas agregadas.

## Portfolios

Un portfolio agrupa proyectos del workspace para visión ejecutiva (similar a Asana Portfolios).

| Elemento | Descripción |
|----------|-------------|
| Proyectos | Referencias a proyectos existentes (sin duplicar datos) |
| Goals | Métricas calculadas sobre las tareas de esos proyectos |

## Métricas de goals (v1)

| Tipo | Descripción |
|------|-------------|
| `tasks_completion_percent` | % de tareas completadas (deduplicadas por tarea) en los proyectos del portfolio |
| `custom_field_rollup` | Suma o promedio de un campo numérico; el campo debe pertenecer a un proyecto incluido en el portfolio |

Estado del goal (calculado): `on_track`, `at_risk`, `off_track`, `achieved` según progreso vs objetivo.

## API

### Portfolios

| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/portfolios` | Listar portfolios del workspace |
| POST | `/portfolios` | Crear portfolio |
| GET | `/portfolios/:id` | Detalle (proyectos + goals con métrica actual) |
| PATCH | `/portfolios/:id` | Actualizar nombre/descripción/color |
| DELETE | `/portfolios/:id` | Eliminar portfolio |
| POST | `/portfolios/:id/projects` | Añadir proyecto (`projectId`) |
| DELETE | `/portfolios/:id/projects/:projectId` | Quitar proyecto |

### Goals

| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/portfolios/:portfolioId/goals` | Listar goals |
| POST | `/portfolios/:portfolioId/goals` | Crear goal |
| GET | `/goals/:goalId` | Detalle + snapshots recientes |
| PATCH | `/goals/:goalId` | Actualizar goal |
| DELETE | `/goals/:goalId` | Eliminar goal |
| GET | `/goals/:goalId/snapshots` | Historial de métrica |
| POST | `/goals/:goalId/snapshots` | Registrar snapshot del valor actual |

Permisos: miembro del workspace.

## UI

- **Navegación → Portfolios** — listado y creación
- **Portfolio → detalle** — proyectos, añadir/quitar, goals con barra de progreso

## Migración

```bash
cd apps/api && pnpm migration:up
```

Tablas: `portfolios`, `portfolio_projects`, `goals`, `goal_metric_snapshots`.
