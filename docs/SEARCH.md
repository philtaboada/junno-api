# Búsqueda workspace-wide

Búsqueda unificada de **projects**, **tasks** y **comments** en un workspace.

## Motores

| `SEARCH_ENGINE` | Comportamiento |
|-----------------|----------------|
| `postgres` (default) | ILIKE en PostgreSQL — sin infra extra |
| `meilisearch` | Índices Meilisearch + fallback automático a PostgreSQL si Meili no responde |

## API

`GET /workspaces/search?q=` — mismo contrato (`WorkspaceSearchResponseDto`) con ambos motores.

Permisos: solo proyectos donde el usuario es miembro (`ProjectMember`).

## Meilisearch local

```bash
# Infra
pnpm docker:search

# .env
SEARCH_ENGINE=meilisearch
MEILI_URL=http://localhost:7700
MEILI_MASTER_KEY=pm_meili_dev_key
```

Índices:

| UID | Contenido |
|-----|-----------|
| `junno_projects` | name, teamName |
| `junno_tasks` | name (solo tareas raíz) |
| `junno_comments` | body, taskName |

## Indexación

Sync en background al crear/actualizar/eliminar:

- **Tasks** — create, update (nombre), multi-home add/remove, delete
- **Projects** — create, update, delete (+ reindex tasks del proyecto)
- **Comments** — create (+ reindex si cambia el nombre de la task)

## Reindex completo

Tras activar Meilisearch sobre datos existentes:

```bash
cd apps/api
SEARCH_ENGINE=meilisearch pnpm search:reindex
```

## Código

- `apps/api/src/modules/search/` — módulo NestJS
- `workspace-search.service.ts` — orquestador (Meili → fallback Postgres)
- `search-indexer.service.ts` — hooks de indexación
