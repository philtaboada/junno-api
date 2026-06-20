type BuildPasswordResetEmailParams = {
  resetUrl: string;
  appName: string;
};

export function buildPasswordResetEmailHtml(
  params: BuildPasswordResetEmailParams,
): string {
  return `
<!DOCTYPE html>
<html lang="es">
  <body style="margin:0;padding:0;background:#f8f7f4;font-family:Arial,sans-serif;color:#1f1f23;">
    <table width="100%" cellpadding="0" cellspacing="0" style="padding:32px 16px;">
      <tr>
        <td align="center">
          <table width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;background:#ffffff;border:1px solid #e8e6e1;border-radius:12px;padding:32px;">
            <tr>
              <td>
                <p style="margin:0 0 8px;font-size:14px;color:#6b7280;">${params.appName}</p>
                <h1 style="margin:0 0 16px;font-size:24px;line-height:1.2;">Restablece tu contraseña</h1>
                <p style="margin:0 0 24px;font-size:15px;line-height:1.6;color:#374151;">
                  Recibimos una solicitud para restablecer la contraseña de tu cuenta.
                  El enlace expira en 1 hora.
                </p>
                <a href="${params.resetUrl}" style="display:inline-block;background:#e85d4c;color:#ffffff;text-decoration:none;font-weight:600;font-size:15px;padding:12px 20px;border-radius:10px;">
                  Restablecer contraseña
                </a>
                <p style="margin:24px 0 0;font-size:13px;line-height:1.6;color:#6b7280;">
                  Si no solicitaste este cambio, puedes ignorar este correo.
                </p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>
`.trim();
}
