import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Resend } from 'resend';
import { buildTeamInvitationEmailHtml } from './team-invitation-email.builder';
import { buildTeamMemberJoinedEmailHtml } from './team-member-joined-email.builder';

type SendTeamInvitationParams = {
  email: string;
  inviteUrl: string;
  teamName: string;
  workspaceName: string;
  inviterName: string;
};

type SendTeamMemberJoinedParams = {
  email: string;
  teamName: string;
  workspaceName: string;
  memberName: string;
  memberEmail: string;
  teamUrl: string;
};

@Injectable()
export class TeamInvitationNotificationService {
  private readonly logger = new Logger(TeamInvitationNotificationService.name);
  private resendClient: Resend | null = null;

  constructor(private readonly configService: ConfigService) {}

  async sendInvitation(params: SendTeamInvitationParams): Promise<void> {
    const apiKey = this.configService.get<string>('RESEND_API_KEY');
    if (!apiKey) {
      this.logger.warn('RESEND_API_KEY no configurada. Enlace en logs (solo dev).');
      this.logger.log(`Invitación de equipo para ${params.email}: ${params.inviteUrl}`);
      return;
    }
    const fromEmail = this.configService.get<string>(
      'RESEND_FROM_EMAIL',
      'no-reply@junno.online',
    );
    const fromName = this.configService.get<string>('RESEND_FROM_NAME', 'Junno');
    const appName = this.configService.get<string>('APP_NAME', 'Junno');
    try {
      const client = this.getResendClient(apiKey);
      const result = await client.emails.send({
        from: `${fromName} <${fromEmail}>`,
        to: params.email,
        subject: `Te invitaron al equipo ${params.teamName} en Junno`,
        html: buildTeamInvitationEmailHtml({
          inviteUrl: params.inviteUrl,
          appName,
          teamName: params.teamName,
          workspaceName: params.workspaceName,
          inviterName: params.inviterName,
        }),
      });
      if (result.error) {
        throw new Error(result.error.message);
      }
      this.logger.log(
        `Invitación de equipo enviada a ${params.email} (id: ${result.data?.id ?? 'n/a'})`,
      );
    } catch (error) {
      this.logger.error(`No se pudo enviar la invitación a ${params.email}`, error);
      if (this.configService.get<string>('NODE_ENV') === 'development') {
        this.logger.log(`Enlace de invitación (fallback): ${params.inviteUrl}`);
      }
    }
  }

  async sendMemberJoined(params: SendTeamMemberJoinedParams): Promise<void> {
    const apiKey = this.configService.get<string>('RESEND_API_KEY');
    if (!apiKey) {
      this.logger.warn('RESEND_API_KEY no configurada. Notificación de join en logs (solo dev).');
      this.logger.log(
        `${params.memberName} se unió a ${params.teamName}: ${params.teamUrl}`,
      );
      return;
    }
    const fromEmail = this.configService.get<string>(
      'RESEND_FROM_EMAIL',
      'no-reply@junno.online',
    );
    const fromName = this.configService.get<string>('RESEND_FROM_NAME', 'Junno');
    const appName = this.configService.get<string>('APP_NAME', 'Junno');
    try {
      const client = this.getResendClient(apiKey);
      const result = await client.emails.send({
        from: `${fromName} <${fromEmail}>`,
        to: params.email,
        subject: `${params.memberName} se unió al equipo ${params.teamName}`,
        html: buildTeamMemberJoinedEmailHtml({
          appName,
          teamName: params.teamName,
          workspaceName: params.workspaceName,
          memberName: params.memberName,
          memberEmail: params.memberEmail,
          teamUrl: params.teamUrl,
        }),
      });
      if (result.error) {
        throw new Error(result.error.message);
      }
      this.logger.log(
        `Notificación de join enviada a ${params.email} (id: ${result.data?.id ?? 'n/a'})`,
      );
    } catch (error) {
      this.logger.error(`No se pudo enviar notificación de join a ${params.email}`, error);
    }
  }

  private getResendClient(apiKey: string): Resend {
    if (!this.resendClient) {
      this.resendClient = new Resend(apiKey);
    }
    return this.resendClient;
  }
}
