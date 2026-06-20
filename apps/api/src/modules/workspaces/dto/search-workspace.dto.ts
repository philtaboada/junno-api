import { IsOptional, IsString } from 'class-validator';

export class SearchWorkspaceDto {
  @IsOptional()
  @IsString()
  q?: string;
}
