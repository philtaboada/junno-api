# Formularios de proyecto

Formularios internos o públicos que crean tareas en un proyecto destino, con campos mapeados a custom fields.

## Flujo

1. Editor del proyecto crea un formulario en **Configuración → Formularios**
2. Añade campos (descripción, vencimiento, custom fields)
3. Comparte enlace interno (`/forms/:id`) o público (`/f/:slug`)
4. El envío crea una tarea en el proyecto (sección configurable)

## Campos soportados

| Tipo formulario | Mapeo |
|-----------------|-------|
| `task_name` | Nombre de la tarea (siempre presente) |
| `task_description` | Descripción |
| `due_at` | Fecha de vencimiento |
| `custom_field` | Campo personalizado (text, number, select, multiselect, date) |

## API

### Autenticado (workspace member)

| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/projects/:projectId/forms` | Listar formularios |
| POST | `/projects/:projectId/forms` | Crear formulario |
| GET | `/forms/:id` | Detalle + campos |
| PATCH | `/forms/:id` | Actualizar (nombre, público, activo, sección) |
| DELETE | `/forms/:id` | Eliminar |
| POST | `/forms/:id/fields` | Añadir campo |
| PATCH | `/forms/:id/fields/:fieldId` | Actualizar campo |
| DELETE | `/forms/:id/fields/:fieldId` | Eliminar campo |
| POST | `/forms/:id/submissions` | Enviar (interno) |

### Público (sin auth)

| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/public/forms/:slug` | Esquema del formulario |
| POST | `/public/forms/:slug/submissions` | Enviar y crear tarea |

Permisos CRUD: editor/admin del proyecto. Envío interno: cualquier miembro del proyecto.

## UI

- **Proyecto → Configuración → Formularios**
- **Interno:** `/forms/:formId` (requiere sesión)
- **Público:** `/f/:slug` (sin sesión, si `isPublic`)

## Migración

```bash
cd apps/api && pnpm migration:up
```

Tablas: `project_forms`, `form_fields`.
