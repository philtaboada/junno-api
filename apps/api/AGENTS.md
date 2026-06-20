# apps/api

Usa **pnpm** (workspace raíz).

```bash
# Desde la raíz
pnpm api:dev
pnpm api:test
```

- NestJS **11** + TypeScript
- Prefijo global: `/api/v1`
- Puerto **3000** (`API_PORT`)
- Env: `../../.env` vía `@nestjs/config`

Ver `docs/AUTH.md` y `.cursor/rules/nestjs-backend.mdc`.
