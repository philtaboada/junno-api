# Deploy rápido — proyecto Vercel `project-3j7je`

> Cuenta/team: **sunno1** → [project-3j7je](https://vercel.com/sunno1/project-3j7je)

## Importante antes de empezar

1. **Inicia sesión en Vercel con la cuenta `sunno1`** (en terminal: `bunx vercel login`).
2. **Producción real:** `www.junno.online` → proyecto **`project-3j7je`**. Existe otro proyecto `web` en la misma cuenta; **no usarlo** para prod (no tiene el dominio custom).
3. El frontend se despliega por **CLI**, no por git push. El backend va en **Railway** vía git push (ver `docs/DEPLOY.md`).

---

## Proyecto 1 — Frontend (`project-3j7je`)

En [Settings → General](https://vercel.com/sunno1/project-3j7je/settings):

| Campo | Valor |
|-------|--------|
| **Root Directory** | `apps/web` |
| **Framework** | Next.js |
| **Node.js** | 22.x |
| **Install Command** | `bun install` |
| **Build Command** | `bun run build` |

### Environment Variables (Settings → Environment Variables)

Pega esto **después** de tener la URL del API desplegado:

```env
NEXT_PUBLIC_API_URL=https://TU-API.vercel.app/api/v1
NEXT_PUBLIC_REALTIME_URL=https://TU-API.vercel.app
```

Sustituye `TU-API` por la URL real del segundo proyecto.

> Supabase y Upstash **no van en el proyecto web** — van en el proyecto **API**.

### Deploy (CLI — método acordado)

Desde la **raíz del monorepo** (el proyecto Vercel tiene Root Directory `apps/web`; si corres desde `apps/web` la ruta se duplica y falla):

```bash
cd project-management
bunx vercel login                              # cuenta sunno1 (una vez)
bunx vercel link --project project-3j7je --scope sunno1 --yes
bunx vercel deploy --prod --yes
```

Verificar que prod apunta a junno.online:

```bash
bunx vercel inspect www.junno.online
# → name: project-3j7je, aliases: www.junno.online
```

**No desplegar en `sunno1/web`** — ese proyecto usa `web-*.vercel.app` y no sirve junno.online.

---

## Proyecto 2 — API (crear nuevo en Vercel)

Crea un proyecto nuevo, mismo repo, **Root Directory:** `apps/api`.

### Environment Variables (API)

Copia desde Supabase / Upstash / Resend:

```env
NODE_ENV=production

# Supabase → Settings → Database → Connection string (Transaction pooler, :6543)
DATABASE_URL=postgresql://postgres.[ref]:[PASSWORD]@aws-0-[region].pooler.supabase.com:6543/postgres?sslmode=require

# Upstash → Redis → REST/URL (usa la URL TLS rediss://)
REDIS_URL=rediss://default:[PASSWORD]@[HOST].upstash.io:6379

JWT_ACCESS_SECRET=genera-un-secreto-minimo-32-caracteres
JWT_ACCESS_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_DAYS=7

# URL del frontend (project-3j7je tras deploy)
CORS_ORIGIN=https://project-3j7je.vercel.app
WEB_APP_URL=https://project-3j7je.vercel.app

RESEND_API_KEY=re_...
RESEND_FROM_EMAIL=no-reply@tudominio.com
RESEND_FROM_NAME=Junno
APP_NAME=Junno

SEARCH_ENGINE=postgres
AUTOMATION_WORKER_ENABLED=false
INTEGRATIONS_WORKER_ENABLED=false
```

### Migraciones (una vez, desde tu Mac)

Usa la conexión **directa** de Supabase (puerto **5432**, no pooler):

```bash
cd apps/api
DATABASE_URL="postgresql://postgres.[ref]:[PASSWORD]@db.[ref].supabase.co:5432/postgres?sslmode=require" \
  pnpm migration:up
```

### Deploy API

```bash
cd apps/web   # o desde raíz
pnpm dlx vercel link --project TU-PROYECTO-API --scope sunno1
cd ../..
pnpm dlx vercel deploy apps/api --prod
```

Smoke test:

```bash
curl https://TU-API.vercel.app/api/v1/health
```

---

## Orden correcto

1. Supabase + Upstash creados  
2. Migraciones en Supabase  
3. Deploy **API** + env vars  
4. Copiar URL del API  
5. Deploy **Web** (`project-3j7je`) con `NEXT_PUBLIC_*`  
6. Actualizar `CORS_ORIGIN` y `WEB_APP_URL` en API con la URL final del web  

---

## Dónde va cada servicio

| Variable | Proyecto |
|----------|----------|
| `DATABASE_URL` (Supabase) | **API** |
| `REDIS_URL` (Upstash) | **API** |
| `JWT_*`, `RESEND_*`, `CORS_*`, `WEB_APP_URL` | **API** |
| `NEXT_PUBLIC_API_URL`, `NEXT_PUBLIC_REALTIME_URL` | **Web** |

Guía extendida: `docs/DEPLOY.md`
