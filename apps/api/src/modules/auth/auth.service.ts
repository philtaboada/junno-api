import { createHash, randomUUID } from 'crypto';
import {
  Injectable,
  ConflictException,
  UnauthorizedException,
  BadRequestException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { EntityManager } from '@mikro-orm/core';
import type { Response } from 'express';
import * as bcrypt from 'bcrypt';
import type {
  AuthSessionDto,
  AuthUserDto,
  ForgotPasswordResponseDto,
  MeResponseDto,
  ResetPasswordResponseDto,
  WorkspaceSummaryDto,
} from '@pm/contracts';
import { PasswordResetToken } from './entities/password-reset-token.entity';
import { RefreshToken } from './entities/refresh-token.entity';
import { User } from './entities/user.entity';
import {
  BCRYPT_ROUNDS,
  PASSWORD_RESET_SUCCESS_MESSAGE,
  PASSWORD_RESET_TTL_MS,
  REFRESH_COOKIE_NAME,
  REFRESH_COOKIE_PATH,
  REFRESH_TOKEN_TTL_MS,
} from './constants/auth.constants';
import type { JwtAccessPayload } from './interfaces/jwt-payload.interface';
import { RegisterDto } from './dto/register.dto';
import { PasswordResetNotificationService } from './password-reset-notification.service';
import { WorkspaceMember, WorkspaceRole } from '../workspaces/entities/workspace-member.entity';
import { Workspace, WorkspaceType } from '../workspaces/entities/workspace.entity';

@Injectable()
export class AuthService {
  constructor(
    private readonly entityManager: EntityManager,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly passwordResetNotification: PasswordResetNotificationService,
  ) {}

  async register(registerDto: RegisterDto, response: Response): Promise<AuthSessionDto> {
    const email = this.normalizeEmail(registerDto.email);
    const existingUser = await this.entityManager.findOne(User, { email });
    if (existingUser) {
      throw new ConflictException('Este email ya está registrado');
    }
    const passwordHash = await bcrypt.hash(registerDto.password, BCRYPT_ROUNDS);
    return this.entityManager.transactional(async (em) => {
      const user = em.create(User, {
        email,
        passwordHash,
        name: registerDto.name.trim(),
      });
      const workspace = em.create(Workspace, {
        name: `${registerDto.name.trim()}'s workspace`,
        type: WorkspaceType.PERSONAL,
      });
      em.create(WorkspaceMember, {
        user,
        workspace,
        role: WorkspaceRole.ADMIN,
      });
      await em.flush();
      return this.issueSession(user, response, em);
    });
  }

  async validateUser(email: string, password: string): Promise<User | null> {
    const user = await this.entityManager.findOne(User, {
      email: this.normalizeEmail(email),
    });
    if (!user) {
      return null;
    }
    const isValid = await bcrypt.compare(password, user.passwordHash);
    if (!isValid) {
      return null;
    }
    return user;
  }

  async login(user: User, response: Response): Promise<AuthSessionDto> {
    return this.issueSession(user, response, this.entityManager);
  }

  async refresh(refreshToken: string | undefined, response: Response): Promise<AuthSessionDto> {
    if (!refreshToken) {
      throw new UnauthorizedException('Sesión expirada. Inicia sesión de nuevo');
    }
    const tokenHash = this.hashToken(refreshToken);
    const storedToken = await this.entityManager.findOne(
      RefreshToken,
      { tokenHash, revokedAt: null },
      { populate: ['user'] },
    );
    if (!storedToken || storedToken.expiresAt.getTime() <= Date.now()) {
      throw new UnauthorizedException('Sesión expirada. Inicia sesión de nuevo');
    }
    storedToken.revokedAt = new Date();
    await this.entityManager.flush();
    return this.issueSession(storedToken.user, response, this.entityManager);
  }

  async logout(refreshToken: string | undefined, response: Response): Promise<{ success: true }> {
    if (refreshToken) {
      const tokenHash = this.hashToken(refreshToken);
      const storedToken = await this.entityManager.findOne(RefreshToken, { tokenHash });
      if (storedToken && !storedToken.revokedAt) {
        storedToken.revokedAt = new Date();
        await this.entityManager.flush();
      }
    }
    this.clearRefreshCookie(response);
    return { success: true };
  }

  async getMe(userId: string): Promise<MeResponseDto> {
    const user = await this.entityManager.findOneOrFail(User, { id: userId });
    const workspaces = await this.loadWorkspaceSummaries(userId);
    return {
      user: this.toAuthUserDto(user),
      workspaces,
    };
  }

  async requestPasswordReset(email: string): Promise<ForgotPasswordResponseDto> {
    const normalizedEmail = this.normalizeEmail(email);
    const user = await this.entityManager.findOne(User, { email: normalizedEmail });
    if (!user) {
      return { message: PASSWORD_RESET_SUCCESS_MESSAGE };
    }
    const plainToken = randomUUID();
    await this.entityManager.transactional(async (em) => {
      const pendingTokens = await em.find(PasswordResetToken, { user, usedAt: null });
      for (const pendingToken of pendingTokens) {
        pendingToken.usedAt = new Date();
      }
      em.create(PasswordResetToken, {
        user,
        tokenHash: this.hashToken(plainToken),
        expiresAt: new Date(Date.now() + PASSWORD_RESET_TTL_MS),
      });
      await em.flush();
    });
    const resetUrl = this.buildPasswordResetUrl(plainToken);
    await this.passwordResetNotification.sendResetLink(user.email, resetUrl);
    const isDevelopment = this.configService.get<string>('NODE_ENV') === 'development';
    const hasResend = Boolean(this.configService.get<string>('RESEND_API_KEY'));
    const forceDevExpose =
      this.configService.get<string>('PASSWORD_RESET_DEV_EXPOSE_URL') === 'true';
    if (isDevelopment && (!hasResend || forceDevExpose)) {
      return {
        message: PASSWORD_RESET_SUCCESS_MESSAGE,
        resetUrl,
      };
    }
    return { message: PASSWORD_RESET_SUCCESS_MESSAGE };
  }

  async resetPassword(token: string, password: string): Promise<ResetPasswordResponseDto> {
    const tokenHash = this.hashToken(token.trim());
    const storedToken = await this.entityManager.findOne(
      PasswordResetToken,
      { tokenHash, usedAt: null },
      { populate: ['user'] },
    );
    if (!storedToken || storedToken.expiresAt.getTime() <= Date.now()) {
      throw new BadRequestException('El enlace de recuperación no es válido o ha expirado');
    }
    const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);
    storedToken.usedAt = new Date();
    storedToken.user.passwordHash = passwordHash;
    const activeRefreshTokens = await this.entityManager.find(RefreshToken, {
      user: storedToken.user,
      revokedAt: null,
    });
    for (const refreshToken of activeRefreshTokens) {
      refreshToken.revokedAt = new Date();
    }
    await this.entityManager.flush();
    return { message: 'Contraseña actualizada correctamente. Ya puedes iniciar sesión.' };
  }

  toAuthUserDto(user: User): AuthUserDto {
    return {
      id: user.id,
      email: user.email,
      name: user.name,
    };
  }

  private async issueSession(
    user: User,
    response: Response,
    em: EntityManager,
  ): Promise<AuthSessionDto> {
    const accessToken = this.createAccessToken(user);
    const refreshToken = randomUUID();
    em.create(RefreshToken, {
      user,
      tokenHash: this.hashToken(refreshToken),
      expiresAt: new Date(Date.now() + REFRESH_TOKEN_TTL_MS),
    });
    await em.flush();
    this.setRefreshCookie(response, refreshToken);
    const workspaces = await this.loadWorkspaceSummaries(user.id);
    return {
      accessToken,
      user: this.toAuthUserDto(user),
      workspaces,
    };
  }

  private createAccessToken(user: User): string {
    const payload: JwtAccessPayload = {
      sub: user.id,
      email: user.email,
      type: 'access',
    };
    return this.jwtService.sign(payload);
  }

  private async loadWorkspaceSummaries(userId: string): Promise<WorkspaceSummaryDto[]> {
    const memberships = await this.entityManager.find(
      WorkspaceMember,
      { user: userId },
      { populate: ['workspace'], orderBy: { joinedAt: 'ASC' } },
    );
    return memberships.map((membership) => ({
      id: membership.workspace.id,
      name: membership.workspace.name,
      type: membership.workspace.type,
      role: membership.role,
    }));
  }

  private setRefreshCookie(response: Response, token: string): void {
    response.cookie(REFRESH_COOKIE_NAME, token, {
      ...this.resolveRefreshCookieOptions(),
      maxAge: REFRESH_TOKEN_TTL_MS,
    });
  }

  private clearRefreshCookie(response: Response): void {
    response.clearCookie(REFRESH_COOKIE_NAME, this.resolveRefreshCookieOptions());
  }

  private resolveRefreshCookieOptions(): {
    httpOnly: true;
    secure: boolean;
    sameSite: 'lax' | 'none' | 'strict';
    path: string;
  } {
    const sameSite = this.resolveCookieSameSite();
    return {
      httpOnly: true,
      secure: this.resolveCookieSecure(sameSite),
      sameSite,
      path: REFRESH_COOKIE_PATH,
    };
  }

  private resolveCookieSameSite(): 'lax' | 'none' | 'strict' {
    const configured = process.env.COOKIE_SAME_SITE?.trim().toLowerCase();
    if (configured === 'none' || configured === 'strict' || configured === 'lax') {
      return configured;
    }
    if (process.env.NODE_ENV === 'production') {
      return 'none';
    }
    return 'lax';
  }

  private resolveCookieSecure(sameSite: 'lax' | 'none' | 'strict'): boolean {
    if (sameSite === 'none') {
      return true;
    }
    return process.env.NODE_ENV === 'production';
  }

  private hashToken(token: string): string {
    return createHash('sha256').update(token).digest('hex');
  }

  private normalizeEmail(email: string): string {
    return email.trim().toLowerCase();
  }

  private buildPasswordResetUrl(token: string): string {
    const webAppUrl = this.configService.get<string>('WEB_APP_URL', 'http://localhost:3001');
    return `${webAppUrl.replace(/\/$/, '')}/reset-password?token=${encodeURIComponent(token)}`;
  }
}
