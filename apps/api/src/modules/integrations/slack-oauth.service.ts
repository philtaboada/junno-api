import { createHmac, timingSafeEqual } from 'crypto';
import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

type SlackOAuthStatePayload = {
  readonly integrationId: string;
  readonly workspaceId: string;
  readonly exp: number;
};

type SlackOAuthTokenResponse = {
  readonly ok: boolean;
  readonly access_token?: string;
  readonly team?: { readonly id: string; readonly name: string };
  readonly error?: string;
};

@Injectable()
export class SlackOAuthService {
  constructor(private readonly configService: ConfigService) {}

  buildAuthorizeUrl(integrationId: string, workspaceId: string): string {
    const clientId = this.getRequiredEnv('SLACK_CLIENT_ID');
    const redirectUri = this.getRequiredEnv('SLACK_REDIRECT_URI');
    const state = this.signState({ integrationId, workspaceId, exp: Date.now() + 600_000 });
    const scopes = ['chat:write', 'channels:read'].join(',');
    const params = new URLSearchParams({
      client_id: clientId,
      scope: scopes,
      redirect_uri: redirectUri,
      state,
    });
    return `https://slack.com/oauth/v2/authorize?${params.toString()}`;
  }

  parseState(state: string): SlackOAuthStatePayload {
    const [payloadBase64, signature] = state.split('.');
    if (!payloadBase64 || !signature) {
      throw new BadRequestException('Estado OAuth inválido');
    }
    const expectedSignature = this.signPayload(payloadBase64);
    const actualBuffer = Buffer.from(signature);
    const expectedBuffer = Buffer.from(expectedSignature);
    if (
      actualBuffer.length !== expectedBuffer.length ||
      !timingSafeEqual(actualBuffer, expectedBuffer)
    ) {
      throw new BadRequestException('Estado OAuth inválido');
    }
    const payload = JSON.parse(
      Buffer.from(payloadBase64, 'base64url').toString('utf8'),
    ) as SlackOAuthStatePayload;
    if (payload.exp < Date.now()) {
      throw new BadRequestException('Estado OAuth expirado');
    }
    return payload;
  }

  async exchangeCodeForToken(code: string): Promise<{
    readonly botToken: string;
    readonly teamId: string;
    readonly teamName: string;
  }> {
    const clientId = this.getRequiredEnv('SLACK_CLIENT_ID');
    const clientSecret = this.getRequiredEnv('SLACK_CLIENT_SECRET');
    const redirectUri = this.getRequiredEnv('SLACK_REDIRECT_URI');
    const body = new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      code,
      redirect_uri: redirectUri,
    });
    const response = await fetch('https://slack.com/api/oauth.v2.access', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body,
    });
    const payload = (await response.json()) as SlackOAuthTokenResponse;
    if (!response.ok || !payload.ok || !payload.access_token) {
      throw new BadRequestException(payload.error ?? 'No se pudo conectar Slack');
    }
    if (!payload.team?.id || !payload.team.name) {
      throw new NotFoundException('Respuesta de Slack incompleta');
    }
    return {
      botToken: payload.access_token,
      teamId: payload.team.id,
      teamName: payload.team.name,
    };
  }

  private signState(payload: SlackOAuthStatePayload): string {
    const payloadBase64 = Buffer.from(JSON.stringify(payload)).toString('base64url');
    return `${payloadBase64}.${this.signPayload(payloadBase64)}`;
  }

  private signPayload(payloadBase64: string): string {
    const secret =
      this.configService.get<string>('JWT_ACCESS_SECRET') ?? 'junno-dev-secret';
    return createHmac('sha256', secret).update(payloadBase64).digest('base64url');
  }

  private getRequiredEnv(key: string): string {
    const value = this.configService.get<string>(key);
    if (!value) {
      throw new BadRequestException(`${key} no configurada`);
    }
    return value;
  }
}
