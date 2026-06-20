import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Resend } from 'resend';
import { buildPasswordResetEmailHtml } from './password-reset-email.builder';

@Injectable()
export class PasswordResetNotificationService {
  private readonly logger = new Logger(PasswordResetNotificationService.name);
  private resendClient: Resend | null = null;

  constructor(private readonly configService: ConfigService) {}

  async sendResetLink(email: string, resetUrl: string): Promise<void> {
    const apiKey = this.configService.get<string>('RESEND_API_KEY');
    if (!apiKey) {
      this.logger.warn('RESEND_API_KEY no configurada. Enlace en logs (solo dev).');
      this.logger.log(`Enlace de recuperación para ${email}: ${resetUrl}`);
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
        to: email,
        subject: 'Restablece tu contraseña en Junno',
        html: buildPasswordResetEmailHtml({ resetUrl, appName }),
      });
      if (result.error) {
        throw new Error(result.error.message);
      }
      this.logger.log(`Correo de recuperación enviado a ${email} (id: ${result.data?.id ?? 'n/a'})`);
    } catch (error) {
      this.logger.error(`No se pudo enviar el correo de recuperación a ${email}`, error);
      if (this.configService.get<string>('NODE_ENV') === 'development') {
        this.logger.log(`Enlace de recuperación (fallback): ${resetUrl}`);
      }
    }
  }

  private getResendClient(apiKey: string): Resend {
    if (!this.resendClient) {
      this.resendClient = new Resend(apiKey);
    }
    return this.resendClient;
  }
}
