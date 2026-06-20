import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsNumber,
  IsUUID,
  ValidateNested,
} from 'class-validator';

class TaskPositionUpdateDto {
  @IsUUID()
  taskId!: string;

  @IsUUID()
  sectionId!: string;

  @IsNumber()
  position!: number;
}

export class ReorderTasksDto {
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => TaskPositionUpdateDto)
  tasks!: TaskPositionUpdateDto[];
}
