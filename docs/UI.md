# UI — shadcn/ui + design system

Stack de interfaz para `apps/web`. **Editable por ti.**

## Stack

| Pieza | Elección |
|-------|----------|
| Componentes | **shadcn/ui v4** (estilo `base-nova`, Radix/Base UI) |
| Estilos | Tailwind CSS **4** + CSS variables |
| Iconos | **lucide-react** |
| Formularios | **react-hook-form** + **zod** + `Field` (shadcn) |
| Toasts | **sonner** |

## Identidad visual

**Marca: Junno.** Minimalista + dos acentos. Superficies neutras, mucho aire. El color guía la acción, no decora todo.

| Token | Nombre | Uso |
|-------|--------|-----|
| `--brand-coral` | **Coral** | CTA principal, botón primario, acciones críticas (crear, guardar, completar) |
| `--brand-indigo` | **Índigo** | Navegación, links, selección, badges, sidebar, focus ring |

### Reglas de color

1. **Un CTA coral por vista** — no competir con varios botones primarios.
2. **Índigo para estructura** — sidebar, tabs activos, workspace activo, links.
3. **Neutros para el 90%** — fondos, bordes, texto secundario (`muted-foreground`).
4. **Sin arcoíris** — estados (done, overdue, priority) llegarán como tokens semánticos en fase 2.
5. **Dark mode** — mismos roles; coral/índigo un poco más claros sobre fondo oscuro.

### Tailwind (clases de marca)

```
bg-brand-coral          text-brand-coral
bg-brand-coral-muted    bg-brand-indigo
bg-brand-indigo-muted   text-brand-indigo
app-shell-bg            /* gradiente sutil en layouts */
```

Mapeo shadcn: `--primary` → coral, `--accent` → índigo muted, `--ring` → índigo.

## Tipografía y espaciado

- Fuente: **Geist** (sans), Geist Mono para código/datos
- Títulos: `font-semibold tracking-tight`; evitar `font-bold` salvo énfasis puntual
- Jerarquía: `text-3xl` (página) → `text-xl` (sección) → `text-base` (cuerpo) → `text-sm text-muted-foreground` (meta)
- Espaciado generoso: `gap-6`/`gap-8` entre bloques; `p-4`/`p-6` en cards

## Componentes y layout

| Zona | Estilo |
|------|--------|
| Cards | Fondo blanco (`card`), borde suave, **sin sombras fuertes** |
| Auth | Centrado + `app-shell-bg` + `AppMark` |
| App shell | Sidebar índigo + header + workspace switcher (`features/shell/`) |
| Forms | `Field` + un botón `default` (coral) |

Primitivos en `src/components/ui/` — no meter lógica de negocio.  
Features en `src/features/<domain>/`.  
Marca en `src/components/brand/`.

## shadcn — añadir componentes

```bash
cd apps/web
bunx shadcn@latest add button input card --yes
```

| Feature | Componentes |
|---------|---------------|
| Task pane | `sheet` |
| Sidebar app | `sidebar` |
| Workspace switcher | `dropdown-menu`, `command` |
| Dialogs | `dialog` |
| Tabs vistas | `tabs` |

## Package manager

**Solo Bun.** No npm.

## Referencias para agentes

- Regla Cursor: `.cursor/rules/ui-design.mdc`
- Tokens: `apps/web/src/app/globals.css`
- Marca: `apps/web/src/components/brand/app-mark.tsx`
