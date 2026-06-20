export interface JwtAccessPayload {
  readonly sub: string;
  readonly email: string;
  readonly type: 'access';
}

export interface AuthenticatedUser {
  readonly id: string;
  readonly email: string;
  readonly name: string;
}

export interface WorkspaceContext {
  readonly workspace: {
    readonly id: string;
    readonly name: string;
    readonly type: string;
  };
  readonly membership: {
    readonly id: string;
    readonly role: string;
  };
  readonly user: AuthenticatedUser;
}

declare global {
  namespace Express {
    interface User extends AuthenticatedUser {}

    interface Request {
      workspaceContext?: WorkspaceContext;
    }
  }
}

export {};
