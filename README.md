# Junno API — NestJS backend

NestJS API for **Junno** (project management). Frontend lives in a separate repo; deploy this service on **Railway**.

## Stack

- NestJS 11 + MikroORM + PostgreSQL (Supabase)
- Redis (Upstash) — BullMQ, realtime
- Resend — transactional email

## Local dev

```bash
cp .env.example .env
pnpm docker:up          # optional local Postgres + Redis
pnpm install
pnpm api:dev            # http://localhost:3000/api/v1
```

## Production (Railway)

See **`docs/RAILWAY.md`**.

| Command | Action |
|---------|--------|
| Build | `pnpm install && pnpm api:build` |
| Start | `node apps/api/dist/src/main.js` |

## Structure

```
apps/api/           NestJS application
packages/contracts/ Shared TypeScript types
railway.toml        Railway deploy config
```

## Health

```bash
curl http://localhost:3000/api/v1/health
```
