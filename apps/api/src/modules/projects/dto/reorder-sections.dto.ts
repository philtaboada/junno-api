import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsNumber,
  IsUUID,
  ValidateNested,
} from 'class-validator';

class SectionPositionUpdateDto {
  @IsUUID()
  sectionId!: string;

  @IsNumber()
  position!: number;
}

export class ReorderSectionsDto {
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => SectionPositionUpdateDto)
  sections!: SectionPositionUpdateDto[];
}
