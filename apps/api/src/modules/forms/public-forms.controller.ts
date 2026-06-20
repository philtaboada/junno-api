import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import type { PublicFormDto, SubmitFormResponseDto } from '@pm/contracts';
import { SubmitFormDto } from './dto/form.dto';
import { FormsService } from './forms.service';

@Controller('public/forms')
export class PublicFormsController {
  constructor(private readonly formsService: FormsService) {}

  @Get(':publicSlug')
  getPublicForm(@Param('publicSlug') publicSlug: string): Promise<PublicFormDto> {
    return this.formsService.getPublicForm(publicSlug);
  }

  @Post(':publicSlug/submissions')
  submitPublic(
    @Param('publicSlug') publicSlug: string,
    @Body() submitFormDto: SubmitFormDto,
  ): Promise<SubmitFormResponseDto> {
    return this.formsService.submitPublic(publicSlug, submitFormDto);
  }
}
