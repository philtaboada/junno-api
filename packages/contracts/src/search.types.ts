export interface WorkspaceSearchTaskResultDto {
  readonly id: string;
  readonly name: string;
  readonly projectId: string;
  readonly projectName: string;
  readonly completedAt: string | null;
}

export interface WorkspaceSearchProjectResultDto {
  readonly id: string;
  readonly name: string;
  readonly teamName: string;
}

export interface WorkspaceSearchCommentResultDto {
  readonly id: string;
  readonly body: string;
  readonly taskId: string;
  readonly taskName: string;
  readonly projectId: string;
  readonly projectName: string;
}

export interface WorkspaceSearchResponseDto {
  readonly query: string;
  readonly tasks: WorkspaceSearchTaskResultDto[];
  readonly projects: WorkspaceSearchProjectResultDto[];
  readonly comments: WorkspaceSearchCommentResultDto[];
}
