import { randomBytes } from 'crypto';
import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { EntityManager } from '@mikro-orm/core';
import type {
  CustomFieldType,
  CustomFieldValueDto,
  FormDetailDto,
  FormFieldDto,
  FormSummaryDto,
  PublicFormDto,
  SubmitFormResponseDto,
} from '@pm/contracts';
import type { WorkspaceContext } from '../auth/interfaces/jwt-payload.interface';
import { User } from '../auth/entities/user.entity';
import {
  ProjectAccessRole,
  ProjectMember,
} from '../projects/entities/project-member.entity';
import { CustomFieldDefinition } from '../projects/entities/custom-field-definition.entity';
import { Project } from '../projects/entities/project.entity';
import { Section } from '../projects/entities/section.entity';
import { TasksService } from '../tasks/tasks.service';
import { Workspace } from '../workspaces/entities/workspace.entity';
import {
  CreateFormDto,
  CreateFormFieldDto,
  SubmitFormDto,
  UpdateFormDto,
  UpdateFormFieldDto,
} from './dto/form.dto';
import { FormField, FormFieldType } from './entities/form-field.entity';
import { ProjectForm } from './entities/project-form.entity';

@Injectable()
export class FormsService {
  constructor(
    private readonly entityManager: EntityManager,
    private readonly tasksService: TasksService,
  ) {}

  async listForProject(
    workspaceId: string,
    projectId: string,
  ): Promise<FormSummaryDto[]> {
    await this.findProjectInWorkspace(workspaceId, projectId);
    const forms = await this.entityManager.find(
      ProjectForm,
      { workspace: workspaceId, project: projectId },
      { orderBy: { createdAt: 'DESC' }, populate: ['project'] },
    );
    const summaries: FormSummaryDto[] = [];
    for (const form of forms) {
      summaries.push(await this.buildFormSummary(form));
    }
    return summaries;
  }

  async createForProject(
    context: WorkspaceContext,
    projectId: string,
    createFormDto: CreateFormDto,
  ): Promise<FormDetailDto> {
    await this.assertProjectEditor(context.workspace.id, projectId, context.user.id);
    const project = await this.findProjectInWorkspace(context.workspace.id, projectId);
    if (createFormDto.sectionId) {
      await this.findSectionInProject(projectId, createFormDto.sectionId);
    }
    const form = this.entityManager.create(ProjectForm, {
      workspace: this.entityManager.getReference(Workspace, context.workspace.id),
      project: this.entityManager.getReference(Project, project.id),
      name: createFormDto.name.trim(),
      description: createFormDto.description?.trim() ?? null,
      publicSlug: this.generatePublicSlug(),
      isPublic: createFormDto.isPublic ?? false,
      isActive: true,
      section: createFormDto.sectionId
        ? this.entityManager.getReference(Section, createFormDto.sectionId)
        : null,
      createdBy: this.entityManager.getReference(User, context.user.id),
    });
    this.entityManager.create(FormField, {
      workspace: this.entityManager.getReference(Workspace, context.workspace.id),
      form,
      type: FormFieldType.TASK_NAME,
      label: 'Nombre de la tarea',
      required: true,
      position: 0,
    });
    await this.entityManager.flush();
    return this.buildFormDetail(form);
  }

  async getForWorkspace(workspaceId: string, formId: string): Promise<FormDetailDto> {
    const form = await this.findFormInWorkspace(workspaceId, formId);
    return this.buildFormDetail(form);
  }

  async updateForm(
    context: WorkspaceContext,
    formId: string,
    updateFormDto: UpdateFormDto,
  ): Promise<FormDetailDto> {
    const form = await this.findFormInWorkspace(context.workspace.id, formId);
    await this.assertProjectEditor(
      context.workspace.id,
      form.project.id,
      context.user.id,
    );
    if (updateFormDto.name !== undefined) {
      form.name = updateFormDto.name.trim();
    }
    if (updateFormDto.description !== undefined) {
      form.description = updateFormDto.description?.trim() ?? null;
    }
    if (updateFormDto.isPublic !== undefined) {
      form.isPublic = updateFormDto.isPublic;
    }
    if (updateFormDto.isActive !== undefined) {
      form.isActive = updateFormDto.isActive;
    }
    if (updateFormDto.sectionId !== undefined) {
      if (updateFormDto.sectionId) {
        await this.findSectionInProject(form.project.id, updateFormDto.sectionId);
        form.section = this.entityManager.getReference(
          Section,
          updateFormDto.sectionId,
        );
      } else {
        form.section = null;
      }
    }
    await this.entityManager.flush();
    return this.buildFormDetail(form);
  }

  async removeForm(context: WorkspaceContext, formId: string): Promise<void> {
    const form = await this.findFormInWorkspace(context.workspace.id, formId);
    await this.assertProjectEditor(
      context.workspace.id,
      form.project.id,
      context.user.id,
    );
    await this.entityManager.remove(form);
    await this.entityManager.flush();
  }

  async addField(
    context: WorkspaceContext,
    formId: string,
    createFormFieldDto: CreateFormFieldDto,
  ): Promise<FormDetailDto> {
    const form = await this.findFormInWorkspace(context.workspace.id, formId);
    await this.assertProjectEditor(
      context.workspace.id,
      form.project.id,
      context.user.id,
    );
    if (createFormFieldDto.type === FormFieldType.TASK_NAME) {
      throw new BadRequestException('El campo nombre ya existe en el formulario');
    }
    let customFieldDefinition: CustomFieldDefinition | null = null;
    if (createFormFieldDto.type === FormFieldType.CUSTOM_FIELD) {
      if (!createFormFieldDto.customFieldDefinitionId) {
        throw new BadRequestException('customFieldDefinitionId es obligatorio');
      }
      customFieldDefinition = await this.findCustomFieldInProject(
        context.workspace.id,
        form.project.id,
        createFormFieldDto.customFieldDefinitionId,
      );
      this.assertCustomFieldSupportedInForms(customFieldDefinition.type);
    }
    const lastField = await this.entityManager.findOne(
      FormField,
      { form: form.id },
      { orderBy: { position: 'DESC' } },
    );
    this.entityManager.create(FormField, {
      workspace: this.entityManager.getReference(Workspace, context.workspace.id),
      form: this.entityManager.getReference(ProjectForm, form.id),
      type: createFormFieldDto.type,
      label: createFormFieldDto.label.trim(),
      required: createFormFieldDto.required ?? false,
      position: createFormFieldDto.position ?? (lastField?.position ?? -1) + 1,
      customFieldDefinition,
    });
    await this.entityManager.flush();
    return this.buildFormDetail(form);
  }

  async updateField(
    context: WorkspaceContext,
    formId: string,
    fieldId: string,
    updateFormFieldDto: UpdateFormFieldDto,
  ): Promise<FormDetailDto> {
    const form = await this.findFormInWorkspace(context.workspace.id, formId);
    await this.assertProjectEditor(
      context.workspace.id,
      form.project.id,
      context.user.id,
    );
    const field = await this.findFieldInForm(form.id, fieldId);
    if (field.type === FormFieldType.TASK_NAME && updateFormFieldDto.required === false) {
      throw new BadRequestException('El nombre de la tarea es obligatorio');
    }
    if (updateFormFieldDto.label !== undefined) {
      field.label = updateFormFieldDto.label.trim();
    }
    if (updateFormFieldDto.required !== undefined) {
      field.required = updateFormFieldDto.required;
    }
    if (updateFormFieldDto.position !== undefined) {
      field.position = updateFormFieldDto.position;
    }
    await this.entityManager.flush();
    return this.buildFormDetail(form);
  }

  async removeField(
    context: WorkspaceContext,
    formId: string,
    fieldId: string,
  ): Promise<FormDetailDto> {
    const form = await this.findFormInWorkspace(context.workspace.id, formId);
    await this.assertProjectEditor(
      context.workspace.id,
      form.project.id,
      context.user.id,
    );
    const field = await this.findFieldInForm(form.id, fieldId);
    if (field.type === FormFieldType.TASK_NAME) {
      throw new BadRequestException('No se puede eliminar el campo nombre');
    }
    await this.entityManager.remove(field);
    await this.entityManager.flush();
    return this.buildFormDetail(form);
  }

  async submitInternal(
    context: WorkspaceContext,
    formId: string,
    submitFormDto: SubmitFormDto,
  ): Promise<SubmitFormResponseDto> {
    const form = await this.findFormInWorkspace(context.workspace.id, formId);
    await this.assertProjectViewer(
      context.workspace.id,
      form.project.id,
      context.user.id,
    );
    if (!form.isActive) {
      throw new BadRequestException('Este formulario está desactivado');
    }
    return this.submitForm(form, submitFormDto, context.user.id);
  }

  async getPublicForm(publicSlug: string): Promise<PublicFormDto> {
    const form = await this.entityManager.findOne(
      ProjectForm,
      { publicSlug, isPublic: true, isActive: true },
      { populate: ['project', 'workspace'] },
    );
    if (!form) {
      throw new NotFoundException('Formulario no encontrado');
    }
    const fields = await this.loadFormFields(form.id);
    return {
      id: form.id,
      name: form.name,
      description: form.description,
      projectName: form.project.name,
      workspaceName: form.workspace.name,
      fields: fields.map((field) => this.mapFormField(field)),
    };
  }

  async submitPublic(
    publicSlug: string,
    submitFormDto: SubmitFormDto,
  ): Promise<SubmitFormResponseDto> {
    const form = await this.entityManager.findOne(
      ProjectForm,
      { publicSlug, isPublic: true, isActive: true },
      { populate: ['project', 'createdBy'] },
    );
    if (!form) {
      throw new NotFoundException('Formulario no encontrado');
    }
    return this.submitForm(form, submitFormDto, form.createdBy.id);
  }

  private async submitForm(
    form: ProjectForm,
    submitFormDto: SubmitFormDto,
    createdByUserId: string,
  ): Promise<SubmitFormResponseDto> {
    const fields = await this.loadFormFields(form.id);
    const parsed = this.parseSubmission(fields, submitFormDto.values);
    const task = await this.tasksService.createFromFormSubmission(
      form.workspace.id,
      form.project.id,
      createdByUserId,
      {
        name: parsed.taskName,
        description: parsed.taskDescription,
        dueAt: parsed.dueAt,
        sectionId: form.section?.id ?? null,
        customFieldValues: parsed.customFieldValues,
      },
    );
    return {
      taskId: task.id,
      taskName: task.name,
      projectId: form.project.id,
    };
  }

  private parseSubmission(
    fields: FormField[],
    values: Record<string, unknown>,
  ): {
    taskName: string;
    taskDescription: string | null;
    dueAt: string | null;
    customFieldValues: Record<string, CustomFieldValueDto | null>;
  } {
    let taskName = '';
    let taskDescription: string | null = null;
    let dueAt: string | null = null;
    const customFieldValues: Record<string, CustomFieldValueDto | null> = {};
    for (const field of fields) {
      const rawValue = values[field.id];
      const isEmpty =
        rawValue === undefined ||
        rawValue === null ||
        (typeof rawValue === 'string' && rawValue.trim().length === 0);
      if (field.required && isEmpty) {
        throw new BadRequestException(`El campo «${field.label}» es obligatorio`);
      }
      if (isEmpty) {
        continue;
      }
      switch (field.type) {
        case FormFieldType.TASK_NAME:
          if (typeof rawValue !== 'string') {
            throw new BadRequestException(`Valor inválido para «${field.label}»`);
          }
          taskName = rawValue.trim();
          break;
        case FormFieldType.TASK_DESCRIPTION:
          if (typeof rawValue !== 'string') {
            throw new BadRequestException(`Valor inválido para «${field.label}»`);
          }
          taskDescription = rawValue.trim();
          break;
        case FormFieldType.DUE_AT:
          if (typeof rawValue !== 'string') {
            throw new BadRequestException(`Valor inválido para «${field.label}»`);
          }
          dueAt = rawValue;
          break;
        case FormFieldType.CUSTOM_FIELD: {
          if (!field.customFieldDefinition) {
            throw new BadRequestException('Campo personalizado no configurado');
          }
          customFieldValues[field.customFieldDefinition.id] = this.parseCustomFieldValue(
            field.customFieldDefinition.type as CustomFieldType,
            rawValue,
            field.label,
          );
          break;
        }
        default:
          break;
      }
    }
    if (taskName.length === 0) {
      throw new BadRequestException('El nombre de la tarea es obligatorio');
    }
    return { taskName, taskDescription, dueAt, customFieldValues };
  }

  private parseCustomFieldValue(
    type: CustomFieldType,
    rawValue: unknown,
    label: string,
  ): CustomFieldValueDto {
    switch (type) {
      case 'text':
        if (typeof rawValue !== 'string') {
          throw new BadRequestException(`Valor inválido para «${label}»`);
        }
        return { type: 'text', text: rawValue.trim() };
      case 'number': {
        const parsedNumber =
          typeof rawValue === 'number' ? rawValue : Number.parseFloat(String(rawValue));
        if (Number.isNaN(parsedNumber)) {
          throw new BadRequestException(`Valor inválido para «${label}»`);
        }
        return { type: 'number', number: parsedNumber };
      }
      case 'select':
        if (typeof rawValue !== 'string') {
          throw new BadRequestException(`Valor inválido para «${label}»`);
        }
        return { type: 'select', optionId: rawValue };
      case 'multiselect':
        if (!Array.isArray(rawValue)) {
          throw new BadRequestException(`Valor inválido para «${label}»`);
        }
        return {
          type: 'multiselect',
          optionIds: rawValue.filter((item): item is string => typeof item === 'string'),
        };
      case 'date':
        if (typeof rawValue !== 'string') {
          throw new BadRequestException(`Valor inválido para «${label}»`);
        }
        return { type: 'date', date: rawValue };
      default:
        throw new BadRequestException(`Tipo de campo no soportado en formularios: ${type}`);
    }
  }

  private async buildFormDetail(form: ProjectForm): Promise<FormDetailDto> {
    await this.entityManager.populate(form, ['project', 'section']);
    const fields = await this.loadFormFields(form.id);
    const summary = await this.buildFormSummary(form, fields.length);
    return {
      ...summary,
      sectionId: form.section?.id ?? null,
      fields: fields.map((field) => this.mapFormField(field)),
      publicUrl: `/f/${form.publicSlug}`,
      internalUrl: `/forms/${form.id}`,
    };
  }

  private async buildFormSummary(
    form: ProjectForm,
    fieldCount?: number,
  ): Promise<FormSummaryDto> {
    const resolvedFieldCount =
      fieldCount ??
      (await this.entityManager.count(FormField, {
        form: form.id,
      }));
    return {
      id: form.id,
      projectId: form.project.id,
      name: form.name,
      description: form.description,
      isPublic: form.isPublic,
      isActive: form.isActive,
      publicSlug: form.publicSlug,
      fieldCount: resolvedFieldCount,
      createdAt: form.createdAt?.toISOString() ?? new Date().toISOString(),
    };
  }

  private async loadFormFields(formId: string): Promise<FormField[]> {
    return this.entityManager.find(
      FormField,
      { form: formId },
      {
        populate: ['customFieldDefinition'],
        orderBy: { position: 'ASC' },
      },
    );
  }

  private mapFormField(field: FormField): FormFieldDto {
    return {
      id: field.id,
      type: field.type,
      label: field.label,
      required: field.required,
      position: field.position,
      customFieldDefinitionId: field.customFieldDefinition?.id ?? null,
      customFieldType: field.customFieldDefinition
        ? (field.customFieldDefinition.type as CustomFieldType)
        : null,
      customFieldSettings: field.customFieldDefinition?.settings ?? null,
    };
  }

  private generatePublicSlug(): string {
    return randomBytes(8).toString('hex');
  }

  private assertCustomFieldSupportedInForms(type: string): void {
    if (['text', 'number', 'select', 'multiselect', 'date'].includes(type)) {
      return;
    }
    throw new BadRequestException('Este tipo de campo no se admite en formularios');
  }

  private async findFormInWorkspace(
    workspaceId: string,
    formId: string,
  ): Promise<ProjectForm> {
    const form = await this.entityManager.findOne(
      ProjectForm,
      { id: formId, workspace: workspaceId },
      { populate: ['project', 'section', 'createdBy'] },
    );
    if (!form) {
      throw new NotFoundException('Formulario no encontrado');
    }
    return form;
  }

  private async findFieldInForm(formId: string, fieldId: string): Promise<FormField> {
    const field = await this.entityManager.findOne(FormField, {
      id: fieldId,
      form: formId,
    });
    if (!field) {
      throw new NotFoundException('Campo no encontrado');
    }
    return field;
  }

  private async findProjectInWorkspace(
    workspaceId: string,
    projectId: string,
  ): Promise<Project> {
    const project = await this.entityManager.findOne(Project, {
      id: projectId,
      workspace: workspaceId,
    });
    if (!project) {
      throw new NotFoundException('Proyecto no encontrado');
    }
    return project;
  }

  private async findSectionInProject(
    projectId: string,
    sectionId: string,
  ): Promise<Section> {
    const section = await this.entityManager.findOne(Section, {
      id: sectionId,
      project: projectId,
    });
    if (!section) {
      throw new NotFoundException('Sección no encontrada');
    }
    return section;
  }

  private async findCustomFieldInProject(
    workspaceId: string,
    projectId: string,
    fieldId: string,
  ): Promise<CustomFieldDefinition> {
    const field = await this.entityManager.findOne(CustomFieldDefinition, {
      id: fieldId,
      workspace: workspaceId,
      project: projectId,
    });
    if (!field) {
      throw new NotFoundException('Campo personalizado no encontrado');
    }
    return field;
  }

  private async assertProjectEditor(
    workspaceId: string,
    projectId: string,
    userId: string,
  ): Promise<void> {
    const membership = await this.entityManager.findOne(ProjectMember, {
      project: projectId,
      user: userId,
    });
    if (!membership) {
      throw new ForbiddenException('No tienes acceso a este proyecto');
    }
    if (
      membership.role !== ProjectAccessRole.ADMIN &&
      membership.role !== ProjectAccessRole.EDITOR
    ) {
      throw new ForbiddenException('Se requiere rol editor o admin');
    }
  }

  private async assertProjectViewer(
    workspaceId: string,
    projectId: string,
    userId: string,
  ): Promise<void> {
    const membership = await this.entityManager.findOne(ProjectMember, {
      project: projectId,
      user: userId,
    });
    if (!membership) {
      throw new ForbiddenException('No tienes acceso a este proyecto');
    }
  }
}
