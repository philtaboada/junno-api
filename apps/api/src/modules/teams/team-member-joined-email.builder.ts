type BuildTeamMemberJoinedEmailParams = {
  appName: string;
  teamName: string;
  workspaceName: string;
  memberName: string;
  memberEmail: string;
  teamUrl: string;
};

export function buildTeamMemberJoinedEmailHtml(
  params: BuildTeamMemberJoinedEmailParams,
): string {
  return `
    <!DOCTYPE html>
    <html lang="es">
      <body style="margin:0;padding:0;background:#f6f4f1;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
        <table width="100%" cellpadding="0" cellspacing="0" style="padding:32px 16px;">
          <tr>
            <td align="center">
              <table width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;background:#ffffff;border-radius:14px;padding:28px 24px;">
                <tr>
                  <td style="font-size:22px;font-weight:600;color:#1a1a1a;padding-bottom:12px;">
                    Nuevo miembro en ${params.teamName}
                  </td>
                </tr>
                <tr>
                  <td style="font-size:15px;line-height:1.6;color:#4b5563;padding-bottom:20px;">
                    <strong>${params.memberName}</strong> (${params.memberEmail}) se unió al equipo
                    <strong>${params.teamName}</strong> en el workspace <strong>${params.workspaceName}</strong>.
                  </td>
                </tr>
                <tr>
                  <td>
                    <a href="${params.teamUrl}" style="display:inline-block;background:#e85d4c;color:#ffffff;text-decoration:none;font-weight:600;font-size:15px;padding:12px 20px;border-radius:10px;">
                      Ver equipo
                    </a>
                  </td>
                </tr>
                <tr>
                  <td style="font-size:12px;color:#9ca3af;padding-top:24px;">
                    ${params.appName} · Notificación de equipo
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
    </html>
  `;
}
