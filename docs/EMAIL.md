# Email — Resend (Junno)

Configuración de correo transaccional para recuperación de contraseña y futuras notificaciones.

## Variables

| Variable | Valor |
|----------|-------|
| `RESEND_API_KEY` | API key del dashboard Resend |
| `RESEND_FROM_EMAIL` | `no-reply@junno.online` |
| `RESEND_FROM_NAME` | `Junno` |
| `APP_NAME` | `Junno` |
| `WEB_APP_URL` | URL pública de la web (ej. `http://localhost:3001`) |

## Verificar dominio `junno.online`

1. Entra a [resend.com/domains](https://resend.com/domains)
2. **Add Domain** → `junno.online`
3. En tu proveedor DNS (Cloudflare, Namecheap, etc.), añade los registros que Resend muestra:
   - **DKIM** (TXT o CNAME)
   - **SPF** (TXT en `@` o subdominio indicado)
   - **DMARC** (recomendado; TXT `_dmarc`)
4. Espera estado **Verified** (puede tardar minutos u horas)
5. Reinicia el API: `pnpm api:dev`

## Probar end-to-end

1. Abre http://localhost:3001/forgot-password
2. Introduce un email real
3. Revisa bandeja y spam
4. El remitente debe ser **Junno &lt;no-reply@junno.online&gt;**
5. El enlace debe apuntar a `{WEB_APP_URL}/reset-password?token=...`

## Errores frecuentes

| Error | Causa |
|-------|--------|
| Dominio no verificado | DNS pendiente en Resend |
| Solo llega a tu email | Antes usabas `onboarding@resend.dev` (sandbox) |
| Sin correo, enlace en logs | `RESEND_API_KEY` ausente o envío falló — revisa logs del API |

## Implementación

- Servicio reset: `apps/api/src/modules/auth/password-reset-notification.service.ts`
- Plantilla reset: `apps/api/src/modules/auth/password-reset-email.builder.ts`
- Invitaciones a equipos: `apps/api/src/modules/teams/team-invitation-notification.service.ts`
- Flujo auth: `docs/AUTH.md` → Recuperación de contraseña

### Invitaciones a equipos

1. En `/teams/:id`, invitar con email → `POST /teams/:id/invitations`
2. Resend envía enlace a `{WEB_APP_URL}/team-invite?token=...`
3. Invitado crea cuenta o inicia sesión → `POST /team-invitations/accept`
4. Se añade al workspace (si no era miembro) y al equipo

### Notificación al unirse al equipo

Cuando alguien acepta una invitación o se añade al equipo:

1. Los miembros con `notifyOnJoin` activo reciben email vía `sendMemberJoined()`
2. Se crea un evento en `activity_events` (inbox) — `GET /inbox/events`
3. Preferencias por usuario/equipo: `GET/PATCH /teams/:id/notification-preferences`

Servicio: `team-invitation-notification.service.ts` → `sendMemberJoined()`  
Plantilla: `team-member-joined-email.builder.ts`

## Producción

- `WEB_APP_URL=https://app.junno.online` (o tu URL real)
- `NODE_ENV=production` — no se expone `resetUrl` en la respuesta API
- Rota la API key si se filtró en chat o logs
