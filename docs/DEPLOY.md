# Despliegue — Vercel + Railway + Supabase + Upstash

> Guía para producción de **Junno**.

## Resumen

| Componente | Dónde | Repo path |
|------------|-------|-----------|
| Frontend | **Vercel** | `apps/web` |
| API NestJS | **Railway** | raíz monorepo → `apps/api` |
| PostgreSQL | **Supabase** | — |
| Redis | **Upstash** | — |
| Email | **Resend** | — |

```
Usuario → Vercel (Next.js) → Railway (NestJS) → Supabase + Upstash
```

**Guías detalladas:**

- API Railway → **`docs/RAILWAY.md`** ← empezar aquí para el backend
- Frontend Vercel → sección 3 abajo
- Integraciones env → `docs/INTEGRATIONS.md`

> **Nota:** El API en Vercel (`apps/api/vercel.json`) no es compatible con MikroORM 7 + WebSockets. Usar **Railway** para el backend.

---

## 1. Supabase (PostgreSQL)

1. Crea un proyecto en [supabase.com](https://supabase.com).
2. **Settings → Database → Connection string**:
   - **Transaction pooler** (puerto **6543**) → runtime API en Railway (`DATABASE_URL`).
   - **Direct** (puerto **5432**) → migraciones desde tu Mac.

Ejemplo pooler:

```bash
DATABASE_URL=postgresql://postgres.[project-ref]:[password]@aws-0-[region].pooler.supabase.com:6543/postgres?sslmode=require
```

### Migraciones (una vez)

```bash
cd apps/api
DATABASE_URL="postgresql://postgres.[ref]:[password]@db.[ref].supabase.co:5432/postgres?sslmode=require" \
  pnpm migration:up
```

---

## 2. Upstash (Redis)

1. Crea Redis en [upstash.com](https://upstash.com).
2. Copia la URL **TCP TLS** (`rediss://...`) — **no** la REST URL.

```bash
REDIS_URL=rediss://default:XXXX@XXXX.upstash.io:6379
```

Usada por BullMQ (automation, integraciones). En Railway los workers pueden quedar en `true`.

---

## 3. Frontend — Vercel CLI (`project-3j7je`)

| Setting | Valor |
|---------|--------|
| **Proyecto Vercel** | **`project-3j7je`** (team `sunno1`) |
| **Dominio prod** | `https://www.junno.online` |
| **Root Directory** | `apps/web` |
| **Install Command** | `bun install` |
| **Build Command** | `bun run build` |
| **Método deploy** | **CLI** (`bunx vercel deploy --prod`) desde la raíz del monorepo |

> **⚠️** En la cuenta hay otro proyecto llamado `web` (`web-phi-six-70.vercel.app`). **No es producción.** Los deploys deben ir siempre a `project-3j7je`.

```bash
cd project-management
bunx vercel link --project project-3j7je --scope sunno1 --yes
bunx vercel deploy --prod --yes
```

### Environment Variables

| Variable | Valor |
|----------|--------|
| `NEXT_PUBLIC_API_URL` | `https://TU-RAILWAY.up.railway.app/api/v1` |
| `NEXT_PUBLIC_REALTIME_URL` | `https://TU-RAILWAY.up.railway.app` |

Ver `apps/web/vercel.json` y `docs/VERCEL-QUICKSTART.md`.

---

## 4. Backend — Railway

Config en la raíz del repo: `railway.toml`, `nixpacks.toml`.

| Setting | Valor |
|---------|--------|
| **Root Directory** | `.` (raíz monorepo) |
| **Build** | `pnpm install && pnpm api:build` |
| **Start** | `node apps/api/dist/src/main.js` |

Variables de entorno y pasos: **`docs/RAILWAY.md`**.

---

## 5. Orden de despliegue

1. Supabase + Upstash + Resend configurados.
2. Migraciones en Supabase.
3. **Railway** → `git push origin main` → probar `/api/v1/health`.
4. **Vercel** (`project-3j7je`) → env `NEXT_PUBLIC_*` con URL Railway → `bunx vercel deploy --prod`.
5. Railway → `CORS_ORIGIN` y `WEB_APP_URL` = `https://www.junno.online`.

### Cuando pidas deploy en el día a día

| Capa | Acción |
|------|--------|
| **Backend** | commit + `git push origin main` → Railway redeploya solo |
| **Frontend** | `bunx vercel deploy --prod --yes` desde raíz, proyecto **`project-3j7je`** |

---

## 6. Dominios custom (opcional)

| Servicio | Ejemplo |
|----------|---------|
| Web | `app.tudominio.com` (Vercel) |
| API | `api.tudominio.com` (Railway) |

Actualizar env vars y OAuth callbacks con los dominios finales.

---

## 7. Desarrollo local

Sin cambios:

```bash
pnpm docker:up   # Postgres + Redis local (opcional si usas Supabase/Upstash en dev)
pnpm api:dev
pnpm web:dev
```
