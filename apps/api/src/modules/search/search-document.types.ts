export interface ProjectSearchDocument {
  readonly id: string;
  readonly workspaceId: string;
  readonly name: string;
  readonly teamId: string;
  readonly teamName: string;
}

export interface TaskSearchDocument {
  readonly id: string;
  readonly workspaceId: string;
  readonly name: string;
  readonly projectIds: readonly string[];
  readonly projectId: string;
  readonly projectName: string;
  readonly completedAt: string | null;
}

export interface CommentSearchDocument {
  readonly id: string;
  readonly workspaceId: string;
  readonly body: string;
  readonly taskId: string;
  readonly taskName: string;
  readonly projectIds: readonly string[];
  readonly projectId: string;
  readonly projectName: string;
}
