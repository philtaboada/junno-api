export type WorkspaceType = 'personal' | 'organization';

export type WorkspaceRole = 'admin' | 'member' | 'guest';

export interface AuthUserDto {
  readonly id: string;
  readonly email: string;
  readonly name: string;
}

export interface WorkspaceSummaryDto {
  readonly id: string;
  readonly name: string;
  readonly type: WorkspaceType;
  readonly role: WorkspaceRole;
}

export interface RegisterRequestDto {
  readonly email: string;
  readonly password: string;
  readonly name: string;
}

export interface LoginRequestDto {
  readonly email: string;
  readonly password: string;
}

export interface LoginResponseDto {
  readonly accessToken: string;
  readonly user: AuthUserDto;
}

export interface AuthSessionDto extends LoginResponseDto {
  readonly workspaces: WorkspaceSummaryDto[];
}

export interface MeResponseDto {
  readonly user: AuthUserDto;
  readonly workspaces: WorkspaceSummaryDto[];
}

export interface CreateWorkspaceRequestDto {
  readonly name: string;
}

export interface ForgotPasswordRequestDto {
  readonly email: string;
}

export interface ForgotPasswordResponseDto {
  readonly message: string;
  readonly resetUrl?: string;
}

export interface ResetPasswordRequestDto {
  readonly token: string;
  readonly password: string;
}

export interface ResetPasswordResponseDto {
  readonly message: string;
}
