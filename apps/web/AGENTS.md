# apps/web

Usa **Bun** exclusivamente (**no npm**).

```bash
# Desde la raíz
pnpm web:dev
bun --cwd apps/web dev

# shadcn — siempre bunx
bunx shadcn@latest add sheet sidebar --yes
```

- Next.js **16** + React **19** + Tailwind **4**
- **shadcn/ui v4** — ver `docs/UI.md` y `.cursor/rules/ui-design.mdc`
- Puerto **3001**

Ver `AGENTS.md` y `.cursor/rules/react-frontend.mdc`.
