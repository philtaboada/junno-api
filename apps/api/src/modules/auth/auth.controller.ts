import {
  Body,
  Controller,
  Get,
  HttpCode,
  Post,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import type { AuthSessionDto, MeResponseDto } from '@pm/contracts';
import { AuthService } from './auth.service';
import { CurrentUser } from './decorators/current-user.decorator';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { JwtAuthGuard, LocalAuthGuard } from './guards/auth.guards';
import { REFRESH_COOKIE_NAME } from './constants/auth.constants';
import type { AuthenticatedUser } from './interfaces/jwt-payload.interface';
import { EntityManager } from '@mikro-orm/core';
import { User } from './entities/user.entity';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly entityManager: EntityManager,
  ) {}

  @Post('register')
  async register(
    @Body() registerDto: RegisterDto,
    @Res({ passthrough: true }) response: Response,
  ): Promise<AuthSessionDto> {
    return this.authService.register(registerDto, response);
  }

  @UseGuards(LocalAuthGuard)
  @Post('login')
  @HttpCode(200)
  async login(
    @Body() _loginDto: LoginDto,
    @CurrentUser() authUser: AuthenticatedUser,
    @Res({ passthrough: true }) response: Response,
  ): Promise<AuthSessionDto> {
    const user = await this.entityManager.findOneOrFail(User, { id: authUser.id });
    return this.authService.login(user, response);
  }

  @Post('refresh')
  @HttpCode(200)
  async refresh(
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
  ): Promise<AuthSessionDto> {
    const refreshToken = request.cookies[REFRESH_COOKIE_NAME] as string | undefined;
    return this.authService.refresh(refreshToken, response);
  }

  @UseGuards(JwtAuthGuard)
  @Post('logout')
  @HttpCode(200)
  async logout(
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
  ): Promise<{ success: true }> {
    const refreshToken = request.cookies[REFRESH_COOKIE_NAME] as string | undefined;
    return this.authService.logout(refreshToken, response);
  }

  @UseGuards(JwtAuthGuard)
  @Get('me')
  async getMe(@CurrentUser() authUser: AuthenticatedUser): Promise<MeResponseDto> {
    return this.authService.getMe(authUser.id);
  }

  @Post('forgot-password')
  @HttpCode(200)
  async forgotPassword(@Body() forgotPasswordDto: ForgotPasswordDto) {
    return this.authService.requestPasswordReset(forgotPasswordDto.email);
  }

  @Post('reset-password')
  @HttpCode(200)
  async resetPassword(@Body() resetPasswordDto: ResetPasswordDto) {
    return this.authService.resetPassword(resetPasswordDto.token, resetPasswordDto.password);
  }
}
