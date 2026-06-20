# Infraestructura local con Docker

Levanta PostgreSQL y Redis para desarrollo. La API (`apps/api`) y el frontend se ejecutan en el host por ahora; solo la infra compartida va en contenedores.

## Requisitos

- Docker Desktop o Docker Engine + Compose v2

## Inicio rápido

```bash
# Desde la raíz del repo
cp .env.example .env
docker compose up -d
docker compose ps
```

Servicios:

| Servicio | Puerto host | Uso |
|----------|-------------|-----|
| **postgres** | `5432` | DB principal (MikroORM) |
| **redis** | `6379` | Pub/sub real-time, cache, colas (BullMQ) |
| **meilisearch** | `7700` | Search — solo con profile `search` (fase 2) |

## Comandos útiles

```bash
# Levantar infra
docker compose up -d

# Ver logs
docker compose logs -f

# Parar (conserva datos)
docker compose down

# Parar y borrar volúmenes (reset total de DB)
docker compose down -v

# Meilisearch (opcional, fase 2)
docker compose --profile search up -d
```

Scripts npm/pnpm en `package.json` raíz:

```bash
pnpm docker:up
pnpm docker:down
pnpm docker:logs
pnpm docker:reset
pnpm docker:search
```

## Variables de entorno

Copiar `.env.example` → `.env`. La API leerá las mismas variables cuando exista `apps/api`.

| Variable | Default local | Descripción |
|----------|---------------|-------------|
| `POSTGRES_USER` | `pm` | Usuario PostgreSQL |
| `POSTGRES_PASSWORD` | `pm_dev_password` | Password PostgreSQL |
| `POSTGRES_DB` | `project_management` | Nombre de la base |
| `POSTGRES_PORT` | `5432` | Puerto expuesto |
| `DATABASE_URL` | (compuesta) | URL para MikroORM |
| `REDIS_HOST` | `localhost` | Host Redis |
| `REDIS_PORT` | `6379` | Puerto Redis |
| `REDIS_URL` | `redis://localhost:6379` | URL Redis |
| `MEILI_URL` | `http://localhost:7700` | URL Meilisearch (profile `search`) |
| `MEILI_MASTER_KEY` | `pm_meili_dev_key` | API key Meilisearch |
| `SEARCH_ENGINE` | `postgres` | `postgres` \| `meilisearch` |

## Conexión desde NestJS (referencia)

```env
DATABASE_URL=postgresql://pm:pm_dev_password@localhost:5432/project_management
REDIS_URL=redis://localhost:6379
```

## Init de PostgreSQL

Al crear el volumen por primera vez, `docker/postgres/init/01-extensions.sql` habilita:

- `citext` — emails case-insensitive (ver `docs/AUTH.md`)
- `pgcrypto` — utilidades cripto si se necesitan

## Healthchecks

Compose espera a que postgres y redis estén healthy antes de considerar el stack listo. Para comprobar manualmente:

```bash
docker compose exec postgres pg_isready -U pm -d project_management
docker compose exec redis redis-cli ping
```

## Producción

Este `docker-compose.yml` es **solo desarrollo local**. Producción usará otro despliegue (managed Postgres, Redis, etc.).
