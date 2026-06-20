import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { EntityManager } from '@mikro-orm/core';
import type {
  CustomFieldDefinitionDto,
  CustomFieldSettingsDto,
  CustomFieldType,
  CustomFieldValueDto,
} from '@pm/contracts';
import { randomUUID } from 'crypto';
import { Workspace } from '../workspaces/entities/workspace.entity';
import { CreateCustomFieldDto, UpdateCustomFieldDto } from './dto/custom-field.dto';
import { CustomFieldDefinition } from './entities/custom-field-definition.entity';
import { CustomFieldValue } from './entities/custom-field-value.entity';
import { ProjectListColumn } from './entities/project-list-column.entity';
import { Project } from './entities/project.entity';

type FieldOption = {
  readonly id: string;
  readonly label: string;
  readonly color: string | null;
};

@Injectable()
export class CustomFieldsService {
  buildDefaultSettings(type: CustomFieldType): CustomFieldSettingsDto {
    switch (type) {
      case 'select':
      case 'multiselect':
        return {
          options: [
            { id: randomUUID(), label: 'Opción 1', color: null },
            { id: randomUUID(), label: 'Opción 2', color: null },
          ],
        };
      case 'date':
        return { includeTime: false };
      case 'people':
        return { allowMultiple: false };
      case 'text':
        return { maxLength: 255 };
      case 'number':
        return { precision: 0 };
      case 'timer':
        return {};
      default:
        return {};
    }
  }

  mergeSettings(
    type: CustomFieldType,
    settings?: Record<string, unknown>,
  ): CustomFieldSettingsDto {
    const defaults = this.buildDefaultSettings(type);
    if (!settings) {
      return defaults;
    }
    return {
      ...defaults,
      ...settings,
      options: Array.isArray(settings.options)
        ? (settings.options as FieldOption[])
        : defaults.options,
    };
  }

  toDefinitionDto(field: CustomFieldDefinition): CustomFieldDefinitionDto {
    return {
      id: field.id,
      projectId: field.project.id,
      name: field.name,
      type: field.type as CustomFieldType,
      settings: field.settings as CustomFieldSettingsDto,
      position: field.position,
      createdAt: field.createdAt?.toISOString() ?? new Date().toISOString(),
    };
  }

  toValueDto(
    field: CustomFieldDefinition,
    rawValue: Record<string, unknown> | null | undefined,
  ): CustomFieldValueDto {
    const type = field.type as CustomFieldType;
    if (!rawValue) {
      return this.emptyValueDto(type);
    }
    switch (type) {
      case 'select':
        return {
          type: 'select',
          optionId: typeof rawValue.optionId === 'string' ? rawValue.optionId : null,
        };
      case 'multiselect':
        return {
          type: 'multiselect',
          optionIds: Array.isArray(rawValue.optionIds)
            ? rawValue.optionIds.filter((item): item is string => typeof item === 'string')
            : [],
        };
      case 'date': {
        const settings = field.settings as CustomFieldSettingsDto;
        if (settings.isRange) {
          return {
            type: 'date',
            startDate:
              typeof rawValue.startDate === 'string' ? rawValue.startDate : null,
            endDate: typeof rawValue.endDate === 'string' ? rawValue.endDate : null,
          };
        }
        return {
          type: 'date',
          date: typeof rawValue.date === 'string' ? rawValue.date : null,
        };
      }
      case 'people':
        return {
          type: 'people',
          userIds: Array.isArray(rawValue.userIds)
            ? rawValue.userIds.filter((item): item is string => typeof item === 'string')
            : [],
        };
      case 'text':
        return {
          type: 'text',
          text: typeof rawValue.text === 'string' ? rawValue.text : null,
        };
      case 'number':
        return {
          type: 'number',
          number: typeof rawValue.number === 'number' ? rawValue.number : null,
        };
      case 'timer':
        return {
          type: 'timer',
          seconds: typeof rawValue.seconds === 'number' ? rawValue.seconds : 0,
          runningSince:
            typeof rawValue.runningSince === 'string' ? rawValue.runningSince : null,
        };
      default:
        return this.emptyValueDto(type);
    }
  }

  async createForProject(
    em: EntityManager,
    workspaceId: string,
    project: Project,
    createDto: CreateCustomFieldDto,
  ): Promise<CustomFieldDefinition> {
    const trimmedName = createDto.name.trim();
    const existing = await em.findOne(CustomFieldDefinition, {
      project: project.id,
      name: trimmedName,
    });
    if (existing) {
      throw new BadRequestException('Ya existe un campo con ese nombre');
    }
    const settings = this.mergeSettings(
      createDto.type as CustomFieldType,
      createDto.settings,
    );
    this.validateSettings(createDto.type as CustomFieldType, settings);
    const workspace = em.getReference(Workspace, workspaceId);
    const lastField = await em.findOne(
      CustomFieldDefinition,
      { project: project.id },
      { orderBy: { position: 'DESC' } },
    );
    const lastColumn = await em.findOne(
      ProjectListColumn,
      { project: project.id },
      { orderBy: { position: 'DESC' } },
    );
    const nextFieldPosition = (lastField?.position ?? -1) + 1;
    const nextColumnPosition = (lastColumn?.position ?? -1) + 1;
    const field = em.create(CustomFieldDefinition, {
      workspace,
      project,
      name: trimmedName,
      type: createDto.type,
      settings,
      position: nextFieldPosition,
    });
    em.create(ProjectListColumn, {
      project,
      customField: field,
      position: nextColumnPosition,
      visible: createDto.visible ?? true,
      width: this.defaultColumnWidth(createDto.type as CustomFieldType),
    });
    return field;
  }

  async updateForProject(
    em: EntityManager,
    projectId: string,
    fieldId: string,
    updateDto: UpdateCustomFieldDto,
  ): Promise<CustomFieldDefinition> {
    const field = await em.findOneOrFail(
      CustomFieldDefinition,
      { id: fieldId, project: projectId },
      { populate: ['project'] },
    );
    if (updateDto.name !== undefined) {
      const trimmedName = updateDto.name.trim();
      const duplicate = await em.findOne(CustomFieldDefinition, {
        project: projectId,
        name: trimmedName,
        id: { $ne: fieldId },
      });
      if (duplicate) {
        throw new BadRequestException('Ya existe un campo con ese nombre');
      }
      field.name = trimmedName;
    }
    if (updateDto.settings !== undefined) {
      const merged = this.mergeSettings(field.type as CustomFieldType, {
        ...(field.settings as CustomFieldSettingsDto),
        ...updateDto.settings,
      });
      this.validateSettings(field.type as CustomFieldType, merged);
      field.settings = merged as Record<string, unknown>;
    }
    return field;
  }

  async removeFromProject(
    em: EntityManager,
    projectId: string,
    fieldId: string,
  ): Promise<void> {
    const field = await em.findOne(CustomFieldDefinition, {
      id: fieldId,
      project: projectId,
    });
    if (!field) {
      throw new NotFoundException('Campo personalizado no encontrado');
    }
    const values = await em.find(CustomFieldValue, { fieldDefinition: fieldId });
    const column = await em.findOne(ProjectListColumn, {
      project: projectId,
      customField: fieldId,
    });
    if (column) {
      em.remove(column);
    }
    for (const value of values) {
      em.remove(value);
    }
    em.remove(field);
  }

  async listDefinitionsForProject(
    em: EntityManager,
    projectId: string,
  ): Promise<CustomFieldDefinitionDto[]> {
    const fields = await em.find(
      CustomFieldDefinition,
      { project: projectId },
      { orderBy: { position: 'ASC' }, populate: ['project'] },
    );
    return fields.map((field) => this.toDefinitionDto(field));
  }

  async listDefinitionsForProjects(
    em: EntityManager,
    projectIds: string[],
  ): Promise<CustomFieldDefinitionDto[]> {
    if (projectIds.length === 0) {
      return [];
    }
    const fields = await em.find(
      CustomFieldDefinition,
      { project: { $in: projectIds } },
      { orderBy: { position: 'ASC' }, populate: ['project'] },
    );
    return fields.map((field) => this.toDefinitionDto(field));
  }

  async loadValuesForTasks(
    em: EntityManager,
    projectId: string,
    taskIds: string[],
  ): Promise<Map<string, Record<string, CustomFieldValueDto>>> {
    const result = new Map<string, Record<string, CustomFieldValueDto>>();
    if (taskIds.length === 0) {
      return result;
    }
    const definitions = await em.find(CustomFieldDefinition, { project: projectId });
    if (definitions.length === 0) {
      return result;
    }
    const definitionById = new Map(definitions.map((field) => [field.id, field]));
    const values = await em.find(
      CustomFieldValue,
      {
        task: { $in: taskIds },
        fieldDefinition: { $in: definitions.map((field) => field.id) },
      },
      { populate: ['fieldDefinition', 'task'] },
    );
    for (const value of values) {
      const taskId = value.task.id;
      const fieldId = value.fieldDefinition.id;
      const field = definitionById.get(fieldId);
      if (!field) {
        continue;
      }
      const taskValues = result.get(taskId) ?? {};
      taskValues[fieldId] = this.toValueDto(field, value.value);
      result.set(taskId, taskValues);
    }
    return result;
  }

  normalizeInputValue(
    field: CustomFieldDefinition,
    input: CustomFieldValueDto | null,
  ): Record<string, unknown> | null {
    if (!input) {
      return null;
    }
    const type = field.type as CustomFieldType;
    if (input.type !== type) {
      throw new BadRequestException(`Tipo de valor inválido para ${field.name}`);
    }
    const settings = field.settings as CustomFieldSettingsDto;
    switch (type) {
      case 'select': {
        if (input.type !== 'select') {
          break;
        }
        if (input.optionId === null) {
          return { optionId: null };
        }
        const option = settings.options?.find((item) => item.id === input.optionId);
        if (!option) {
          throw new BadRequestException(`Opción inválida para ${field.name}`);
        }
        return { optionId: input.optionId };
      }
      case 'multiselect': {
        if (input.type !== 'multiselect') {
          break;
        }
        const validIds = new Set(settings.options?.map((item) => item.id) ?? []);
        const optionIds = input.optionIds.filter((item: string) => validIds.has(item));
        return { optionIds };
      }
      case 'date': {
        const settings = field.settings as CustomFieldSettingsDto;
        if (settings.isRange) {
          if (input.type !== 'date') {
            break;
          }
          const startDate = input.startDate ?? null;
          const endDate = input.endDate ?? null;
          if (startDate && endDate && new Date(startDate) > new Date(endDate)) {
            throw new BadRequestException(
              `La fecha de inicio no puede ser posterior a la fecha fin en ${field.name}`,
            );
          }
          return { startDate, endDate };
        }
        if (input.type !== 'date') {
          break;
        }
        return { date: input.date ?? null };
      }
      case 'people':
        if (input.type !== 'people') {
          break;
        }
        return { userIds: input.userIds };
      case 'text':
        if (input.type !== 'text') {
          break;
        }
        return {
          text:
            input.text && settings.maxLength
              ? input.text.slice(0, settings.maxLength)
              : input.text,
        };
      case 'number':
        if (input.type !== 'number') {
          break;
        }
        return { number: input.number };
      case 'timer':
        if (input.type !== 'timer') {
          break;
        }
        return {
          seconds: input.seconds,
          runningSince: input.runningSince,
        };
      default:
        return null;
    }
    return null;
  }

  async applyTaskValues(
    em: EntityManager,
    workspaceId: string,
    projectId: string,
    taskId: string,
    values: Record<string, CustomFieldValueDto | null>,
  ): Promise<Record<string, CustomFieldValueDto>> {
    const definitions = await em.find(CustomFieldDefinition, { project: projectId });
    const definitionById = new Map(definitions.map((field) => [field.id, field]));
    const workspace = em.getReference(Workspace, workspaceId);
    const result: Record<string, CustomFieldValueDto> = {};
    for (const [fieldId, input] of Object.entries(values)) {
      const field = definitionById.get(fieldId);
      if (!field) {
        throw new NotFoundException(`Campo personalizado no encontrado: ${fieldId}`);
      }
      const normalized = this.normalizeInputValue(field, input);
      const existing = await em.findOne(CustomFieldValue, {
        task: taskId,
        fieldDefinition: fieldId,
      });
      if (!normalized || this.isEmptyValue(field.type as CustomFieldType, normalized)) {
        if (existing) {
          em.remove(existing);
        }
        result[fieldId] = this.emptyValueDto(field.type as CustomFieldType);
        continue;
      }
      if (existing) {
        existing.value = normalized;
      } else {
        em.create(CustomFieldValue, {
          workspace,
          task: taskId,
          fieldDefinition: field,
          value: normalized,
        });
      }
      result[fieldId] = this.toValueDto(field, normalized);
    }
    return result;
  }

  private emptyValueDto(type: CustomFieldType): CustomFieldValueDto {
    switch (type) {
      case 'select':
        return { type: 'select', optionId: null };
      case 'multiselect':
        return { type: 'multiselect', optionIds: [] };
      case 'date':
        return { type: 'date', date: null, startDate: null, endDate: null };
      case 'people':
        return { type: 'people', userIds: [] };
      case 'text':
        return { type: 'text', text: null };
      case 'number':
        return { type: 'number', number: null };
      case 'timer':
        return { type: 'timer', seconds: 0, runningSince: null };
      default:
        return { type: 'text', text: null };
    }
  }

  private isEmptyValue(
    type: CustomFieldType,
    value: Record<string, unknown>,
  ): boolean {
    switch (type) {
      case 'select':
        return value.optionId === null || value.optionId === undefined;
      case 'multiselect':
        return !Array.isArray(value.optionIds) || value.optionIds.length === 0;
      case 'date': {
        if (value.startDate || value.endDate) {
          return !value.startDate && !value.endDate;
        }
        return !value.date;
      }
      case 'people':
        return !Array.isArray(value.userIds) || value.userIds.length === 0;
      case 'text':
        return !value.text;
      case 'number':
        return value.number === null || value.number === undefined;
      case 'timer':
        return (
          (value.seconds === 0 || value.seconds === undefined) && !value.runningSince
        );
      default:
        return true;
    }
  }

  private defaultColumnWidth(type: CustomFieldType): number {
    switch (type) {
      case 'select':
      case 'multiselect':
        return 120;
      case 'date':
        return 108;
      case 'people':
        return 96;
      case 'text':
        return 180;
      case 'number':
        return 88;
      case 'timer':
        return 96;
      default:
        return 120;
    }
  }

  private validateSettings(
    type: CustomFieldType,
    settings: CustomFieldSettingsDto,
  ): void {
    if (type === 'select' || type === 'multiselect') {
      const options = settings.options ?? [];
      if (options.length < 1) {
        throw new BadRequestException('Agrega al menos una opción');
      }
      const labels = new Set<string>();
      for (const option of options) {
        const label = option.label.trim();
        if (label.length < 1) {
          throw new BadRequestException('Cada opción necesita una etiqueta');
        }
        if (labels.has(label.toLowerCase())) {
          throw new BadRequestException('Las etiquetas de opción deben ser únicas');
        }
        labels.add(label.toLowerCase());
      }
    }
  }
}
