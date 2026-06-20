import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import type { WorkspaceContext } from '../../auth/interfaces/jwt-payload.interface';

export const CurrentWorkspace = createParamDecorator(
  (_data: unknown, context: ExecutionContext): WorkspaceContext => {
    const request = context.switchToHttp().getRequest<{ workspaceContext: WorkspaceContext }>();
    return request.workspaceContext;
  },
);
