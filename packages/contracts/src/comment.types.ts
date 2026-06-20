export interface CommentAuthorDto {
  readonly userId: string;
  readonly name: string;
  readonly email: string;
}

export interface CommentDto {
  readonly id: string;
  readonly taskId: string;
  readonly author: CommentAuthorDto;
  readonly body: string;
  readonly createdAt: string;
}

export interface CreateCommentRequestDto {
  readonly body: string;
}
