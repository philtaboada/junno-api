# Core (Fase 2) — Cierre

> **Estado:** ✅ **Cerrada** (junio 2026).  
> Checklist de producto: `docs/PRODUCT.md`. Modelo de datos: `docs/DATA-MODEL.md`.

## Resumen ejecutivo

Fase 2 entregó el núcleo operativo tipo Asana:

| Bloque | Entregables |
|--------|-------------|
| **A** | Custom fields en todas las superficies + permisos UI (`canComment`, viewer read-only) |
| **B** | Multi-homing E2E + `activity_events` para Inbox |
| **C** | UI Bandeja + badge unread + vista Calendario |
| **D** | Adjuntos, dependencias, búsqueda workspace + indicador blocked en lista/board |

## Criterios de cierre — cumplidos

- [x] Todas las casillas Core en `docs/PRODUCT.md`
- [x] Nav principal sin items `disabled`
- [x] Tests unitarios en utilidades de memberships/search/attachments/dependencies
- [x] `DATA-MODEL.md` con tablas Fase 2
- [x] Tipos en `packages/contracts` compartidos api/web

## Post-cierre (Fase 2.1 opcional)

- Meilisearch full-text
- Google OAuth + verificación email
- Storage S3 en producción (adjuntos hoy: local `uploads/`)

## Siguiente fase

Ver **`docs/PHASE3.md`**.

---

<details>
<summary>Plan histórico por bloques (referencia)</summary>

Ver commits y secciones anteriores de este archivo para el desglose A→D usado durante la implementación.

</details>
