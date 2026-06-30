# Plantillas de proyecto

Guardar la estructura de un proyecto y reutilizarla al crear proyectos nuevos.

## Qué se copia

| Elemento | Al guardar | Al crear proyecto |
|----------|------------|-----------------|
| Secciones | ✅ | ✅ |
| Campos personalizados | ✅ | ✅ |
| Columnas lista (custom) | ✅ (vía campos) | ✅ |
| Tareas | Opcional | Opcional si la plantilla las incluye |

No se copian: miembros, comentarios, adjuntos, reglas de automatización.

## API

| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/project-templates` | Listar plantillas del workspace |
| GET | `/project-templates/:id` | Detalle |
| POST | `/project-templates` | Guardar desde proyecto (`sourceProjectId`, `includeTasks?`) |
| POST | `/project-templates/:id/projects` | Crear proyecto (`teamId`, `name`, `includeTasks?`) |
| DELETE | `/project-templates/:id` | Eliminar plantilla |

Permisos:

- **Guardar:** editor o admin del proyecto origen
- **Crear / listar / eliminar:** miembro del workspace

## UI

- **Proyecto → Configuración → Plantilla** — guardar como plantilla
- **Proyectos** — lista de plantillas + selector al crear proyecto

## Migración

```bash
cd apps/api && pnpm migration:up
```

Tablas: `project_templates`, `project_template_sections`, `project_template_custom_fields`, `project_template_tasks`.
