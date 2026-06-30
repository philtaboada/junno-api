# Workflow para agentes — inspirado en Eve

## Eve vs Cursor (cuándo usar qué)

| | **Vercel Eve** | **Cursor + este repo** |
|---|----------------|------------------------|
| Para qué | Agentes autónomos desplegados (Slack, cron, API) | Desarrollo del producto en IDE |
| Config | `agent/instructions.md`, `skills/`, `tools/` | `AGENTS.md`, `.cursor/rules/`, `docs/` |
| Runtime | Vercel Functions, sandboxes, workflows durables | Cursor Agent, terminal, git |
| Subagentes | `agent/subagents/` nativo | Reglas por carpeta + Task tool de Cursor |

**Conclusión:** construimos el producto con **Cursor + AGENTS.md**. Eve puede añadirse después para bots (reportes, Slack, QA automatizado), no reemplaza las reglas del repo.

## Roles sugeridos (como subagents de Eve, pero en Cursor)

| Rol | Scope | Lee |
|-----|-------|-----|
| **Architect** | Estructura, docs, contratos | `AGENTS.md`, `docs/ARCHITECTURE.md` |
| **Backend** | `apps/api/**` | `nestjs-backend.mdc`, `DATA-MODEL.md` |
| **Frontend** | `apps/web/**` | `react-frontend.mdc`, layout 5 zonas |
| **Full-stack feature** | Un vertical slice | PRODUCT fase actual + ambas rules |

## Flujo por tarea

1. Leer `AGENTS.md` y doc relevante
2. Confirmar fase en `PRODUCT.md` (no implementar fase 3 en MVP)
3. Implementar scope mínimo
4. Tests si el módulo ya tiene convención de tests
5. No commit salvo petición explícita
6. Si cambias arquitectura → actualizar `docs/`

## Definition of Done (MVP)

- [ ] Tipos en `packages/contracts` si afecta api+web
- [ ] DTOs validados en controller
- [ ] Migración DB si hay entidades nuevas
- [ ] UI coincide con layout 5 zonas
- [ ] Sin `any` innecesarios
- [ ] Linter limpio en archivos tocados

## Eve futuro (opcional)

Si más adelante quieres agentes desplegados:

```
agents/
├── pm-reviewer/
│   ├── instructions.md    # revisa PRs contra AGENTS.md
│   └── tools/
└── pm-daily-digest/
    ├── instructions.md
    └── schedules/
```

Eso sería un proyecto Eve **separado** que lee este repo vía GitHub connection.
