import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import type { FormDetailDto, FormSummaryDto, SubmitFormResponseDto } from '@pm/contracts';
import { JwtAuthGuard } from '../auth/guards/auth.guards';
import type { WorkspaceContext } from '../auth/interfaces/jwt-payload.interface';
import { CurrentWorkspace } from '../workspaces/decorators/current-workspace.decorator';
import { WorkspaceMemberGuard } from '../workspaces/guards/workspace-member.guard';
import {
  CreateFormDto,
  CreateFormFieldDto,
  SubmitFormDto,
  UpdateFormDto,
  UpdateFormFieldDto,
} from './dto/form.dto';
import { FormsService } from './forms.service';

@Controller('projects/:projectId/forms')
@UseGuards(JwtAuthGuard, WorkspaceMemberGuard)
export class ProjectFormsController {
  constructor(private readonly formsService: FormsService) {}

  @Get()
  list(
    @CurrentWorkspace() context: WorkspaceContext,
    @Param('projectId') projectId: string,
  ): Promise<FormSummaryDto[]> {
    return this.formsService.listForProject(context.workspace.id, projectId);
  }

  @Post()
  create(
    @CurrentWorkspace() context: WorkspaceContext,
    @Param('projectId') projectId: string,
    @Body() createFormDto: CreateFormDto,
  ): Promise<FormDetailDto> {
    return this.formsService.createForProject(context, projectId, createFormDto);
  }
}

@Controller('forms')
@UseGuards(JwtAuthGuard, WorkspaceMemberGuard)
export class FormsController {
  constructor(private readonly formsService: FormsService) {}

  @Get(':formId')
  getOne(
    @CurrentWorkspace() context: WorkspaceContext,
    @Param('formId') formId: string,
  ): Promise<FormDetailDto> {
    return this.formsService.getForWorkspace(context.workspace.id, formId);
  }

  @Patch(':formId')
  update(
    @CurrentWorkspace() context: WorkspaceContext,
    @Param('formId') formId: string,
    @Body() updateFormDto: UpdateFormDto,
  ): Promise<FormDetailDto> {
    return this.formsService.updateForm(context, formId, updateFormDto);
  }

  @Delete(':formId')
  remove(
    @CurrentWorkspace() context: WorkspaceContext,
    @Param('formId') formId: string,
  ): Promise<void> {
    return this.formsService.removeForm(context, formId);
  }

  @Post(':formId/fields')
  addField(
    @CurrentWorkspace() context: WorkspaceContext,
    @Param('formId') formId: string,
    @Body() createFormFieldDto: CreateFormFieldDto,
  ): Promise<FormDetailDto> {
    return this.formsService.addField(context, formId, createFormFieldDto);
  }

  @Patch(':formId/fields/:fieldId')
  updateField(
    @CurrentWorkspace() context: WorkspaceContext,
    @Param('formId') formId: string,
    @Param('fieldId') fieldId: string,
    @Body() updateFormFieldDto: UpdateFormFieldDto,
  ): Promise<FormDetailDto> {
    return this.formsService.updateField(context, formId, fieldId, updateFormFieldDto);
  }

  @Delete(':formId/fields/:fieldId')
  removeField(
    @CurrentWorkspace() context: WorkspaceContext,
    @Param('formId') formId: string,
    @Param('fieldId') fieldId: string,
  ): Promise<FormDetailDto> {
    return this.formsService.removeField(context, formId, fieldId);
  }

  @Post(':formId/submissions')
  submit(
    @CurrentWorkspace() context: WorkspaceContext,
    @Param('formId') formId: string,
    @Body() submitFormDto: SubmitFormDto,
  ): Promise<SubmitFormResponseDto> {
    return this.formsService.submitInternal(context, formId, submitFormDto);
  }
}
