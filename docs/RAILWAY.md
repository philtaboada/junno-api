# Backend en Railway — Junno API

> **Frontend:** Vercel (`apps/web`) · **API:** Railway · **DB:** Supabase · **Redis:** Upstash

Railway ejecuta NestJS como **proceso persistente** (WebSockets, BullMQ y MikroORM funcionan sin los límites de Vercel serverless).

## Arquitectura

```
Vercel (Next.js)  ──REST/WS──►  Railway (NestJS)
                                      │
                         ┌────────────┼────────────┐
                         ▼            ▼            ▼
                    Supabase      Upstash       Resend
                    (Postgres)    (Redis)
```

## 1. Preparar el repo en GitHub

Railway despliega desde Git. Si aún no subiste el repo:

```bash
cd project-management
git init
git add .
git commit -m "chore: preparar deploy Railway + Vercel"
git remote add origin https://github.com/TU_USUARIO/junno.git
git push -u origin main
```

## 2. Crear proyecto en Railway

1. Entra en [railway.app](https://railway.app) → **New Project**.
2. **Deploy from GitHub repo** → elige el repo de Junno.
3. Railway crea un servicio. En **Settings → Source**:
   - **Root Directory:** deja vacío (raíz del monorepo) — usa `railway.toml` en la raíz.
4. En **Settings → Build** (debería leer `railway.toml`):
   - **Build Command:** `pnpm install && pnpm api:build`
   - **Start Command:** `node apps/api/dist/src/main.js`
5. En **Settings → Networking** → **Generate Domain** (ej. `junno-api-production.up.railway.app`).

Smoke test tras el primer deploy:

```bash
curl https://TU-DOMINIO-RAILWAY.up.railway.app/api/v1/health
# {"status":"ok"}
```

## 3. Variables de entorno (Railway → Service → Variables)

Copia en el panel de Railway (no uses `localhost`).

### Obligatorias

| Variable | Valor |
|----------|--------|
| `NODE_ENV` | `production` |
| `DATABASE_URL` | Supabase **Session pooler** puerto **5432** |
| `JWT_ACCESS_SECRET` | Mín. 32 caracteres aleatorios |
| `JWT_ACCESS_EXPIRES_IN` | `15m` |
| `JWT_REFRESH_EXPIRES_DAYS` | `7` |
| `CORS_ORIGIN` | URL del frontend Vercel, ej. `https://project-3j7je.vercel.app` |
| `WEB_APP_URL` | Misma URL del frontend |
| `RESEND_API_KEY` | Clave Resend |
| `RESEND_FROM_EMAIL` | `no-reply@junno.online` |
| `RESEND_FROM_NAME` | `Junno` |
| `APP_NAME` | `Junno` |

### Supabase → `DATABASE_URL`

Dashboard Supabase → **Connect** → **ORMs** → **Session pooler** (IPv4, puerto **5432**):

```bash
postgresql://postgres.[PROJECT_REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:5432/postgres?sslmode=require
```

> **No uses el Transaction pooler (6543)** con MikroORM en Railway — provoca errores 500 en login/register.  
> Sustituye `[REGION]` por la región de tu proyecto (ej. `sa-east-1`). La contraseña es la de la base de datos, no la `service_role` key.

### Redis (BullMQ — automation e integraciones)

Con `REDIS_URL` configurada, los workers de automation e integraciones **arrancan solos**. Desactívalos con `=false` si no usas colas.

```bash
REDIS_URL=rediss://default:[PASSWORD]@[HOST]:6379
# AUTOMATION_WORKER_ENABLED=false
# INTEGRATIONS_WORKER_ENABLED=false
```

> Usa URL **TCP** (`rediss://`), no REST. Upstash free no aguanta polling 24/7; Railway Redis u otro proveedor con cuota amplia es mejor para workers permanentes.

### Opcionales

| Variable | Valor |
|----------|--------|
| `SEARCH_ENGINE` | `postgres` |
| `REDIS_URL` | URL TCP `rediss://...` de tu proveedor Redis |
| `AUTOMATION_WORKER_ENABLED` | Omitir (on con `REDIS_URL`) o `false` para desactivar |
| `INTEGRATIONS_WORKER_ENABLED` | Omitir (on con `REDIS_URL`) o `false` para desactivar |
| `COOKIE_SAME_SITE` | `none` si el login falla entre dominios distintos |
| `SLACK_REDIRECT_URI` | `https://TU-RAILWAY/api/v1/public/integrations/slack/oauth/callback` |

Railway inyecta **`PORT`** automáticamente; la API ya lo usa (`main.ts`).

## 4. Migraciones (una vez)

Desde tu Mac, con conexión **directa** Supabase (puerto **5432**):

```bash
cd apps/api
DATABASE_URL="postgresql://postgres.uiogzcxitfdveluczqxe:[PASSWORD]@db.uiogzcxitfdveluczqxe.supabase.co:5432/postgres?sslmode=require" \
  pnpm migration:up
```

## 5. Conectar el frontend (Vercel)

En el proyecto **web** de Vercel → **Environment Variables**:

```bash
NEXT_PUBLIC_API_URL=https://TU-DOMINIO-RAILWAY.up.railway.app/api/v1
NEXT_PUBLIC_REALTIME_URL=https://TU-DOMINIO-RAILWAY.up.railway.app
```

Redeploy el frontend después de guardar.

En Railway, confirma que `CORS_ORIGIN` y `WEB_APP_URL` apuntan a la URL de Vercel.

## 6. Deploy automático

Cada `push` a `main` redeploya la API si el servicio está ligado a esa rama.

### CLI (opcional)

```bash
pnpm dlx @railway/cli login
cd project-management
pnpm dlx @railway/cli link
pnpm dlx @railway/cli up
```

## 7. Coste

Plan **Hobby** ~$5/mes (crédito incluido). Un API + Supabase free + Upstash free suele caber en hobby para MVP.

## 8. Archivos en el repo

| Archivo | Propósito |
|---------|-----------|
| `railway.toml` | Build + start + healthcheck |
| `nixpacks.toml` | Node 22 + pnpm |
| `apps/api/src/main.ts` | Escucha `PORT` (Railway) |

## Troubleshooting

| Síntoma | Causa probable |
|---------|----------------|
| Build falla en `pnpm install` | Lockfile desactualizado → `pnpm install` local y commit |
| `ERR_REQUIRE_ESM` / `@mikro-orm/nestjs` | Node **&lt; 22.17** en el runtime → usar `NIXPACKS_NODE_VERSION=24` en `nixpacks.toml` (ya fijado en el repo) |
| `health` 500 / DB error | `DATABASE_URL` incorrecta o migraciones pendientes |
| Auth 500 (login/register) | `DATABASE_URL` mal — usar **Session pooler :5432**, no Transaction :6543. Probar `GET /api/v1/health/db` |
| Login no guarda sesión | `CORS_ORIGIN` / `WEB_APP_URL` mal o falta `COOKIE_SAME_SITE=none` |
| Colas no corren | Falta `REDIS_URL` TCP o workers desactivados |
| Upstash `max requests limit exceeded` | BullMQ workers hacen polling 24/7 → `AUTOMATION_WORKER_ENABLED=false`, `INTEGRATIONS_WORKER_ENABLED=false` y quita `REDIS_URL` en MVP |
| CORS error en browser | `CORS_ORIGIN` debe ser exactamente la URL del frontend (con `https://`) |

Ver también `docs/DEPLOY.md` (visión general).
