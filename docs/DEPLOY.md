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

## 3. Frontend — Vercel (`apps/web`)

| Setting | Valor |
|---------|--------|
| **Root Directory** | `apps/web` |
| **Install Command** | `bun install` |
| **Build Command** | `bun run build` |

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
3. **Railway** → deploy API → generar dominio → probar `/api/v1/health`.
4. **Vercel** → env `NEXT_PUBLIC_*` con URL Railway → redeploy web.
5. Railway → `CORS_ORIGIN` y `WEB_APP_URL` = URL Vercel.

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
