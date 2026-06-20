import { IsNumber, IsOptional, IsString, MinLength } from 'class-validator';

export class CreateSectionDto {
  @IsString()
  @MinLength(1)
  name!: string;

  @IsOptional()
  @IsNumber()
  position?: number;
}
