import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  BadRequestException,
} from '@nestjs/common';
import { WorkspacesService } from '../workspaces.service';
import { WORKSPACE_HEADER } from '../../auth/constants/auth.constants';
import type { AuthenticatedUser } from '../../auth/interfaces/jwt-payload.interface';

@Injectable()
export class WorkspaceMemberGuard implements CanActivate {
  constructor(private readonly workspacesService: WorkspacesService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<{
      user?: AuthenticatedUser;
      workspaceContext?: unknown;
      headers: Record<string, string | string[] | undefined>;
      params: { id?: string };
    }>();
    if (!request.user) {
      throw new ForbiddenException('Authentication required');
    }
    const headerValue = request.headers[WORKSPACE_HEADER];
    const workspaceIdFromHeader = Array.isArray(headerValue)
      ? headerValue[0]
      : headerValue;
    const workspaceId = workspaceIdFromHeader ?? request.params.id;
    if (!workspaceId) {
      throw new BadRequestException(`Missing ${WORKSPACE_HEADER} header`);
    }
    const membership = await this.workspacesService.findMembership(
      request.user.id,
      workspaceId,
    );
    if (!membership) {
      throw new ForbiddenException('Not a member of this workspace');
    }
    request.workspaceContext = {
      user: request.user,
      workspace: {
        id: membership.workspace.id,
        name: membership.workspace.name,
        type: membership.workspace.type,
      },
      membership: {
        id: membership.id,
        role: membership.role,
      },
    };
    return true;
  }
}
