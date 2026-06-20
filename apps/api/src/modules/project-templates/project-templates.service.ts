import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { EntityManager } from '@mikro-orm/core';
import type {
  CustomFieldType,
  ProjectDetailDto,
  ProjectTemplateDetailDto,
  ProjectTemplateSummaryDto,
} from '@pm/contracts';
import type { WorkspaceContext } from '../auth/interfaces/jwt-payload.interface';
import { User } from '../auth/entities/user.entity';
import { CustomFieldDefinition } from '../projects/entities/custom-field-definition.entity';
import { CustomFieldsService } from '../projects/custom-fields.service';
import { DEFAULT_PROJECT_LIST_COLUMNS } from '../projects/constants/list-columns.constants';
import {
  ProjectAccessRole,
  ProjectMember,
} from '../projects/entities/project-member.entity';
import { ProjectListColumn } from '../projects/entities/project-list-column.entity';
import {
  Project,
  ProjectColor,
  ProjectStatus,
} from '../projects/entities/project.entity';
import { ProjectsService } from '../projects/projects.service';
import { Section } from '../projects/entities/section.entity';
import { SearchIndexerService } from '../search/search-indexer.service';
import { TaskMembership } from '../tasks/entities/task-membership.entity';
import { Task } from '../tasks/entities/task.entity';
import { TeamMember } from '../teams/entities/team-member.entity';
import { Team } from '../teams/entities/team.entity';
import { Workspace } from '../workspaces/entities/workspace.entity';
import {
  CreateProjectFromTemplateDto,
  CreateProjectTemplateDto,
} from './dto/project-template.dto';
import { ProjectTemplateCustomField } from './entities/project-template-custom-field.entity';
import { ProjectTemplateSection } from './entities/project-template-section.entity';
import { ProjectTemplateTask } from './entities/project-template-task.entity';
import { ProjectTemplate } from './entities/project-template.entity';

@Injectable()
export class ProjectTemplatesService {
  constructor(
    private readonly entityManager: EntityManager,
    private readonly customFieldsService: CustomFieldsService,
    private readonly projectsService: ProjectsService,
    private readonly searchIndexerService: SearchIndexerService,
  ) {}

  async listForWorkspace(
    workspaceId: string,
  ): Promise<ProjectTemplateSummaryDto[]> {
    const templates = await this.entityManager.find(
      ProjectTemplate,
      { workspace: workspaceId },
      {
        populate: ['sourceProject'],
        orderBy: { createdAt: 'DESC' },
      },
    );
    const summaries: ProjectTemplateSummaryDto[] = [];
    for (const template of templates) {
      summaries.push(await this.buildSummary(template));
    }
    return summaries;
  }

  async getForWorkspace(
    workspaceId: string,
    templateId: string,
  ): Promise<ProjectTemplateDetailDto> {
    const template = await this.findTemplateInWorkspace(workspaceId, templateId);
    return this.buildDetail(template);
  }

  async createFromProject(
    context: WorkspaceContext,
    createProjectTemplateDto: CreateProjectTemplateDto,
  ): Promise<ProjectTemplateDetailDto> {
    return this.entityManager.transactional(async (em) => {
      const project = await em.findOne(Project, {
        id: createProjectTemplateDto.sourceProjectId,
        workspace: context.workspace.id,
      });
      if (!project) {
        throw new NotFoundException('Proyecto no encontrado');
      }
      await this.assertProjectEditor(project.id, context.user.id, em);
      const sections = await em.find(
        Section,
        { project: project.id },
        { orderBy: { position: 'ASC' } },
      );
      const customFields = await em.find(
        CustomFieldDefinition,
        { project: project.id },
        { orderBy: { position: 'ASC' } },
      );
      const includeTasks = createProjectTemplateDto.includeTasks ?? false;
      const creator = await em.findOneOrFail(User, { id: context.user.id });
      const workspace = em.getReference(Workspace, context.workspace.id);
      const now = new Date();
      const template = em.create(ProjectTemplate, {
        workspace,
        sourceProject: project,
        name: createProjectTemplateDto.name.trim(),
        description: project.description,
        hasTasks: includeTasks,
        createdBy: creator,
        createdAt: now,
        updatedAt: now,
      });
      const sectionIdBySourceId = new Map<string, ProjectTemplateSection>();
      for (const section of sections) {
        const templateSection = em.create(ProjectTemplateSection, {
          workspace,
          template,
          name: section.name,
          position: section.position,
        });
        sectionIdBySourceId.set(section.id, templateSection);
      }
      for (const field of customFields) {
        em.create(ProjectTemplateCustomField, {
          workspace,
          template,
          name: field.name,
          type: field.type,
          settings: field.settings,
          position: field.position,
        });
      }
      if (includeTasks) {
        const memberships = await em.find(
          TaskMembership,
          {
            project: project.id,
            workspace: context.workspace.id,
            task: { parentTask: null },
          },
          {
            populate: ['task', 'section'],
            orderBy: { position: 'ASC' },
          },
        );
        const seenTaskIds = new Set<string>();
        for (const membership of memberships) {
          if (seenTaskIds.has(membership.task.id)) {
            continue;
          }
          seenTaskIds.add(membership.task.id);
          const sectionKey = membership.section?.id ?? sections[0]?.id;
          const templateSection = sectionKey
            ? sectionIdBySourceId.get(sectionKey)
            : undefined;
          if (!templateSection) {
            continue;
          }
          em.create(ProjectTemplateTask, {
            workspace,
            template,
            templateSection,
            name: membership.task.name,
            description: membership.task.description,
            position: membership.position,
          });
        }
      }
      await em.flush();
      await em.populate(template, ['sourceProject']);
      return this.buildDetail(template, em);
    });
  }

  async createProjectFromTemplate(
    context: WorkspaceContext,
    templateId: string,
    createProjectFromTemplateDto: CreateProjectFromTemplateDto,
  ): Promise<ProjectDetailDto> {
    const createdProjectId = await this.entityManager.transactional(async (em) => {
      const template = await em.findOne(
        ProjectTemplate,
        { id: templateId, workspace: context.workspace.id },
      );
      if (!template) {
        throw new NotFoundException('Plantilla no encontrada');
      }
      const team = await em.findOne(Team, {
        id: createProjectFromTemplateDto.teamId,
        workspace: context.workspace.id,
      });
      if (!team) {
        throw new NotFoundException('Equipo no encontrado');
      }
      const teamMember = await em.findOne(TeamMember, {
        team: team.id,
        user: context.user.id,
      });
      if (!teamMember) {
        throw new ForbiddenException('Debes ser miembro del equipo para crear un proyecto');
      }
      const templateSections = await em.find(
        ProjectTemplateSection,
        { template: template.id },
        { orderBy: { position: 'ASC' } },
      );
      if (templateSections.length === 0) {
        throw new BadRequestException('La plantilla no tiene secciones');
      }
      const templateFields = await em.find(
        ProjectTemplateCustomField,
        { template: template.id },
        { orderBy: { position: 'ASC' } },
      );
      const includeTasks =
        (createProjectFromTemplateDto.includeTasks ?? false) && template.hasTasks;
      const templateTasks = includeTasks
        ? await em.find(
            ProjectTemplateTask,
            { template: template.id },
            {
              populate: ['templateSection'],
              orderBy: { position: 'ASC' },
            },
          )
        : [];
      const creator = await em.findOneOrFail(User, { id: context.user.id });
      const workspace = em.getReference(Workspace, context.workspace.id);
      const project = em.create(Project, {
        workspace,
        team,
        name: createProjectFromTemplateDto.name.trim(),
        description:
          createProjectFromTemplateDto.description?.trim() ||
          template.description ||
          null,
        color: createProjectFromTemplateDto.color
          ? this.toEntityColor(createProjectFromTemplateDto.color)
          : null,
        status: ProjectStatus.ACTIVE,
        createdBy: creator,
      });
      em.create(ProjectMember, {
        project,
        user: creator,
        role: ProjectAccessRole.ADMIN,
      });
      this.seedDefaultListColumns(em, project);
      const sectionByTemplateSectionId = new Map<string, Section>();
      for (const templateSection of templateSections) {
        const section = em.create(Section, {
          workspace,
          project,
          name: templateSection.name,
          position: templateSection.position,
        });
        sectionByTemplateSectionId.set(templateSection.id, section);
      }
      await em.flush();
      for (const templateField of templateFields) {
        await this.customFieldsService.createForProject(
          em,
          context.workspace.id,
          project,
          {
            name: templateField.name,
            type: templateField.type as CustomFieldType,
            settings: templateField.settings,
            visible: true,
          },
        );
      }
      const createdTaskIds: string[] = [];
      for (const templateTask of templateTasks) {
        const section = sectionByTemplateSectionId.get(
          templateTask.templateSection.id,
        );
        if (!section) {
          continue;
        }
        const task = em.create(Task, {
          workspace,
          name: templateTask.name,
          description: templateTask.description ?? null,
          createdBy: creator,
          startHasTime: false,
          dueHasTime: false,
        });
        em.create(TaskMembership, {
          workspace,
          task,
          project,
          section,
          position: templateTask.position,
        });
        createdTaskIds.push(task.id);
      }
      await em.flush();
      this.searchIndexerService.syncProject(project.id, context.workspace.id);
      for (const taskId of createdTaskIds) {
        this.searchIndexerService.syncTask(taskId, context.workspace.id);
      }
      return project.id;
    });
    return this.projectsService.getForWorkspace(
      context.workspace.id,
      createdProjectId,
    );
  }

  async removeForWorkspace(
    context: WorkspaceContext,
    templateId: string,
  ): Promise<void> {
    const template = await this.findTemplateInWorkspace(
      context.workspace.id,
      templateId,
    );
    this.entityManager.remove(template);
    await this.entityManager.flush();
  }

  private async findTemplateInWorkspace(
    workspaceId: string,
    templateId: string,
  ): Promise<ProjectTemplate> {
    const template = await this.entityManager.findOne(
      ProjectTemplate,
      { id: templateId, workspace: workspaceId },
      { populate: ['sourceProject'] },
    );
    if (!template) {
      throw new NotFoundException('Plantilla no encontrada');
    }
    return template;
  }

  private async assertProjectEditor(
    projectId: string,
    userId: string,
    em: EntityManager,
  ): Promise<void> {
    const member = await em.findOne(ProjectMember, {
      project: projectId,
      user: userId,
    });
    if (
      !member ||
      (member.role !== ProjectAccessRole.ADMIN &&
        member.role !== ProjectAccessRole.EDITOR)
    ) {
      throw new ForbiddenException('No tienes permiso para exportar esta plantilla');
    }
  }

  private async buildSummary(
    template: ProjectTemplate,
    em: EntityManager = this.entityManager,
  ): Promise<ProjectTemplateSummaryDto> {
    const sectionCount = await em.count(ProjectTemplateSection, {
      template: template.id,
    });
    const customFieldCount = await em.count(ProjectTemplateCustomField, {
      template: template.id,
    });
    const taskCount = await em.count(ProjectTemplateTask, {
      template: template.id,
    });
    return {
      id: template.id,
      name: template.name,
      description: template.description ?? null,
      sourceProjectId: template.sourceProject?.id ?? null,
      sourceProjectName: template.sourceProject?.name ?? null,
      hasTasks: template.hasTasks,
      sectionCount,
      customFieldCount,
      taskCount,
      createdAt: template.createdAt.toISOString(),
    };
  }

  private async buildDetail(
    template: ProjectTemplate,
    em: EntityManager = this.entityManager,
  ): Promise<ProjectTemplateDetailDto> {
    const summary = await this.buildSummary(template, em);
    const sections = await em.find(
      ProjectTemplateSection,
      { template: template.id },
      { orderBy: { position: 'ASC' } },
    );
    const customFields = await em.find(
      ProjectTemplateCustomField,
      { template: template.id },
      { orderBy: { position: 'ASC' } },
    );
    const tasks = await em.find(
      ProjectTemplateTask,
      { template: template.id },
      {
        populate: ['templateSection'],
        orderBy: { position: 'ASC' },
      },
    );
    return {
      ...summary,
      sections: sections.map((section) => ({
        id: section.id,
        name: section.name,
        position: section.position,
      })),
      customFields: customFields.map((field) => ({
        id: field.id,
        name: field.name,
        type: field.type as ProjectTemplateDetailDto['customFields'][number]['type'],
        settings: field.settings as ProjectTemplateDetailDto['customFields'][number]['settings'],
        position: field.position,
      })),
      tasks: tasks.map((task) => ({
        id: task.id,
        sectionId: task.templateSection.id,
        name: task.name,
        description: task.description ?? null,
        position: task.position,
      })),
    };
  }

  private seedDefaultListColumns(em: EntityManager, project: Project): void {
    for (const seed of DEFAULT_PROJECT_LIST_COLUMNS) {
      em.create(ProjectListColumn, {
        project,
        fieldKey: seed.fieldKey,
        position: seed.position,
        visible: seed.visible,
        width: seed.width,
      });
    }
  }

  private toEntityColor(color: NonNullable<ProjectDetailDto['color']>): ProjectColor {
    return color as ProjectColor;
  }
}
