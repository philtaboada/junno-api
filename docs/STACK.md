# Stack local — apps

## Versiones instaladas

| App | Framework | Versión | Package manager |
|-----|-----------|---------|-----------------|
| `apps/api` | NestJS | 11.x | **pnpm** (workspace) |
| `apps/web` | Next.js | 16.x | **Bun** (sin npm) |
| `packages/contracts` | TypeScript | 5.9 | **pnpm** (workspace) |

Node **≥20** (entorno actual: v24). NestJS 11 no soporta Node 18.

## Puertos

| Servicio | Puerto |
|----------|--------|
| API | 3000 → `/api/v1/*` |
| Web | 3001 |
| PostgreSQL | 5432 |
| Redis | 6379 |

## Primer arranque

```bash
cp .env.example .env
pnpm docker:up
pnpm install
pnpm api:dev    # terminal 1
pnpm web:dev    # terminal 2
```

## Smoke test

```bash
curl http://localhost:3000/api/v1/health
# {"status":"ok"}
```

## Estructura monorepo

```
apps/api/          pnpm — NestJS
apps/web/          bun  — Next.js (bun.lock propio)
packages/contracts pnpm — tipos compartidos (@pm/contracts)
pnpm-workspace.yaml
```

`apps/web` **no** está en el pnpm workspace; se gestiona con Bun de forma independiente.
