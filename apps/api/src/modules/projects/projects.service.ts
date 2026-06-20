import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { EntityManager } from '@mikro-orm/core';
import type {
  AddProjectMembersFromTeamResponseDto,
  CustomFieldDefinitionDto,
  ProjectAccessRole as ProjectAccessRoleDto,
  ProjectColor as ProjectColorDto,
  ProjectDetailDto,
  ProjectListColumnDto,
  ProjectListFieldKey,
  ProjectMemberDto,
  ProjectSectionDto,
  ProjectStatus as ProjectStatusDto,
  ProjectSummaryDto,
} from '@pm/contracts';
import type { WorkspaceContext } from '../auth/interfaces/jwt-payload.interface';
import { User } from '../auth/entities/user.entity';
import { TeamMember } from '../teams/entities/team-member.entity';
import { Team } from '../teams/entities/team.entity';
import { Workspace } from '../workspaces/entities/workspace.entity';
import { WorkspaceMember } from '../workspaces/entities/workspace-member.entity';
import {
  DEFAULT_SECTION_NAME,
  DEFAULT_SECTION_POSITION,
  SECTION_POSITION_GAP,
} from './constants/projects.constants';
import { CreateProjectDto } from './dto/create-project.dto';
import { AddProjectMemberDto } from './dto/add-project-member.dto';
import { AddProjectMembersFromTeamDto } from './dto/add-project-members-from-team.dto';
import { CreateSectionDto } from './dto/create-section.dto';
import { ListProjectsQueryDto } from './dto/list-projects-query.dto';
import { ReorderSectionsDto } from './dto/reorder-sections.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
import { UpdateProjectMemberRoleDto } from './dto/update-project-member-role.dto';
import { UpdateSectionDto } from './dto/update-section.dto';
import { UpdateListColumnsDto } from './dto/update-list-columns.dto';
import { CreateCustomFieldDto, UpdateCustomFieldDto } from './dto/custom-field.dto';
import { DEFAULT_PROJECT_LIST_COLUMNS } from './constants/list-columns.constants';
import { CustomFieldsService } from './custom-fields.service';
import { CustomFieldDefinition } from './entities/custom-field-definition.entity';
import { ProjectAccessRole, ProjectMember } from './entities/project-member.entity';
import { ProjectListColumn } from './entities/project-list-column.entity';
import {
  Project,
  ProjectColor,
  ProjectStatus,
} from './entities/project.entity';
import { Section } from './entities/section.entity';
import { SearchIndexerService } from '../search/search-indexer.service';
import { TaskMembership } from '../tasks/entities/task-membership.entity';

@Injectable()
export class ProjectsService {
  private readonly projectDetailPopulate = [
    'team',
    'createdBy',
    'members.user',
    'sections',
    'listColumns.customField',
  ] as const;

  constructor(
    private readonly entityManager: EntityManager,
    private readonly customFieldsService: CustomFieldsService,
    private readonly searchIndexerService: SearchIndexerService,
  ) {}

  async listForWorkspace(
    workspaceId: string,
    query: ListProjectsQueryDto,
  ): Promise<ProjectSummaryDto[]> {
    const where: {
      workspace: string;
      team?: string;
      status?: ProjectStatus;
    } = { workspace: workspaceId };
    if (query.teamId) {
      where.team = query.teamId;
    }
    const statusFilter = query.status ?? 'active';
    if (statusFilter !== 'all') {
      where.status =
        statusFilter === 'archived' ? ProjectStatus.ARCHIVED : ProjectStatus.ACTIVE;
    }
    const projects = await this.entityManager.find(Project, where, {
      populate: ['team', 'members', 'sections'],
      orderBy: { name: 'ASC' },
    });
    return projects.map((project) => this.toSummary(project));
  }

  async createForWorkspace(
    context: WorkspaceContext,
    createProjectDto: CreateProjectDto,
  ): Promise<ProjectDetailDto> {
    return this.entityManager.transactional(async (em) => {
      const team = await em.findOne(Team, {
        id: createProjectDto.teamId,
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
      const creator = await em.findOneOrFail(User, { id: context.user.id });
      const workspace = em.getReference(Workspace, context.workspace.id);
      const project = em.create(Project, {
        workspace,
        team,
        name: createProjectDto.name.trim(),
        description: createProjectDto.description?.trim() || null,
        color: createProjectDto.color
          ? this.toEntityColor(createProjectDto.color)
          : null,
        status: ProjectStatus.ACTIVE,
        createdBy: creator,
      });
      em.create(ProjectMember, {
        project,
        user: creator,
        role: ProjectAccessRole.ADMIN,
      });
      em.create(Section, {
        workspace,
        project,
        name: DEFAULT_SECTION_NAME,
        position: DEFAULT_SECTION_POSITION,
      });
      this.seedDefaultListColumns(em, project);
      await em.flush();
      await em.populate(project, [
        'team',
        'createdBy',
        'members.user',
        'sections',
        'listColumns',
      ]);
      this.searchIndexerService.syncProject(project.id, context.workspace.id);
      return this.buildProjectDetail(project);
    });
  }

  async getForWorkspace(
    workspaceId: string,
    projectId: string,
  ): Promise<ProjectDetailDto> {
    const project = await this.findProjectInWorkspace(workspaceId, projectId);
    await this.ensureListColumns(project);
    await this.entityManager.populate(project, [...this.projectDetailPopulate]);
    return this.buildProjectDetail(project);
  }

  async updateListColumnsForWorkspace(
    context: WorkspaceContext,
    projectId: string,
    updateListColumnsDto: UpdateListColumnsDto,
  ): Promise<ProjectDetailDto> {
    const project = await this.findProjectInWorkspace(context.workspace.id, projectId);
    await this.assertProjectEditor(project.id, context.user.id);
    await this.ensureListColumns(project);
    const columns = await this.entityManager.find(
      ProjectListColumn,
      { project: project.id },
      { populate: ['customField'] },
    );
    const columnByFieldKey = new Map(
      columns
        .filter((column) => column.fieldKey)
        .map((column) => [column.fieldKey, column]),
    );
    const columnByCustomFieldId = new Map(
      columns
        .filter((column) => column.customField)
        .map((column) => [column.customField!.id, column]),
    );
    const hasNameColumn = updateListColumnsDto.columns.some(
      (column) => column.fieldKey === 'name' && column.visible,
    );
    if (!hasNameColumn) {
      throw new BadRequestException('La columna Nombre debe permanecer visible');
    }
    for (const update of updateListColumnsDto.columns) {
      const column = update.customFieldId
        ? columnByCustomFieldId.get(update.customFieldId)
        : update.fieldKey
          ? columnByFieldKey.get(update.fieldKey)
          : undefined;
      if (!column) {
        throw new NotFoundException('Columna no encontrada');
      }
      column.position = update.position;
      column.visible = update.visible;
      column.width = update.width ?? null;
    }
    await this.entityManager.flush();
    await this.entityManager.populate(project, [...this.projectDetailPopulate]);
    return this.buildProjectDetail(project);
  }

  async createCustomFieldForWorkspace(
    context: WorkspaceContext,
    projectId: string,
    createCustomFieldDto: CreateCustomFieldDto,
  ): Promise<ProjectDetailDto> {
    return this.entityManager.transactional(async (em) => {
      const project = await this.findProjectInWorkspace(
        context.workspace.id,
        projectId,
      );
      await this.assertProjectEditor(project.id, context.user.id);
      await this.customFieldsService.createForProject(
        em,
        context.workspace.id,
        project,
        createCustomFieldDto,
      );
      await em.flush();
      await em.populate(project, [...this.projectDetailPopulate]);
      return this.buildProjectDetail(project);
    });
  }

  async updateCustomFieldForWorkspace(
    context: WorkspaceContext,
    projectId: string,
    fieldId: string,
    updateCustomFieldDto: UpdateCustomFieldDto,
  ): Promise<ProjectDetailDto> {
    return this.entityManager.transactional(async (em) => {
      const project = await this.findProjectInWorkspace(
        context.workspace.id,
        projectId,
      );
      await this.assertProjectEditor(project.id, context.user.id);
      await this.customFieldsService.updateForProject(
        em,
        project.id,
        fieldId,
        updateCustomFieldDto,
      );
      await em.flush();
      await em.populate(project, [...this.projectDetailPopulate]);
      return this.buildProjectDetail(project);
    });
  }

  async removeCustomFieldForWorkspace(
    context: WorkspaceContext,
    projectId: string,
    fieldId: string,
  ): Promise<ProjectDetailDto> {
    return this.entityManager.transactional(async (em) => {
      const project = await this.findProjectInWorkspace(
        context.workspace.id,
        projectId,
      );
      await this.assertProjectEditor(project.id, context.user.id);
      await this.customFieldsService.removeFromProject(em, project.id, fieldId);
      await em.flush();
      await em.populate(project, [...this.projectDetailPopulate]);
      return this.buildProjectDetail(project);
    });
  }

  async updateForWorkspace(
    context: WorkspaceContext,
    projectId: string,
    updateProjectDto: UpdateProjectDto,
  ): Promise<ProjectDetailDto> {
    const project = await this.findProjectInWorkspace(context.workspace.id, projectId);
    await this.assertProjectAdmin(project.id, context.user.id);
    if (updateProjectDto.teamId !== undefined) {
      const team = await this.entityManager.findOne(Team, {
        id: updateProjectDto.teamId,
        workspace: context.workspace.id,
      });
      if (!team) {
        throw new NotFoundException('Equipo no encontrado');
      }
      const teamMember = await this.entityManager.findOne(TeamMember, {
        team: team.id,
        user: context.user.id,
      });
      if (!teamMember) {
        throw new ForbiddenException('Debes ser miembro del equipo destino');
      }
      project.team = team;
    }
    if (updateProjectDto.name !== undefined) {
      project.name = updateProjectDto.name.trim();
    }
    if (updateProjectDto.description !== undefined) {
      project.description = updateProjectDto.description?.trim() || null;
    }
    if (updateProjectDto.color !== undefined) {
      project.color = updateProjectDto.color
        ? this.toEntityColor(updateProjectDto.color)
        : null;
    }
    if (updateProjectDto.status !== undefined) {
      project.status = this.toEntityStatus(updateProjectDto.status);
    }
    await this.entityManager.flush();
    await this.entityManager.populate(project, [...this.projectDetailPopulate]);
    this.searchIndexerService.syncProjectWithTasks(project.id, context.workspace.id);
    return this.buildProjectDetail(project);
  }

  async removeForWorkspace(
    context: WorkspaceContext,
    projectId: string,
  ): Promise<void> {
    const project = await this.findProjectInWorkspace(context.workspace.id, projectId);
    await this.assertProjectAdmin(project.id, context.user.id);
    const memberships = await this.entityManager.find(
      TaskMembership,
      { project: projectId, workspace: context.workspace.id },
      { fields: ['task'] },
    );
    const taskIds = [...new Set(memberships.map((membership) => membership.task.id))];
    this.entityManager.remove(project);
    await this.entityManager.flush();
    this.searchIndexerService.removeProject(
      projectId,
      context.workspace.id,
      taskIds,
    );
  }

  async createSectionForWorkspace(
    context: WorkspaceContext,
    projectId: string,
    createSectionDto: CreateSectionDto,
  ): Promise<ProjectDetailDto> {
    const project = await this.findProjectInWorkspace(context.workspace.id, projectId);
    await this.assertProjectEditor(project.id, context.user.id);
    const workspace = this.entityManager.getReference(Workspace, context.workspace.id);
    const position =
      createSectionDto.position ??
      (await this.resolveNextSectionPosition(project.id));
    this.entityManager.create(Section, {
      workspace,
      project,
      name: createSectionDto.name.trim(),
      position,
    });
    await this.entityManager.flush();
    await this.entityManager.populate(project, [...this.projectDetailPopulate]);
    return this.buildProjectDetail(project);
  }

  async updateSectionForWorkspace(
    context: WorkspaceContext,
    projectId: string,
    sectionId: string,
    updateSectionDto: UpdateSectionDto,
  ): Promise<ProjectDetailDto> {
    const project = await this.findProjectInWorkspace(context.workspace.id, projectId);
    await this.assertProjectEditor(project.id, context.user.id);
    const section = await this.findSectionInProject(projectId, sectionId);
    if (updateSectionDto.name !== undefined) {
      section.name = updateSectionDto.name.trim();
    }
    await this.entityManager.flush();
    await this.entityManager.populate(project, [...this.projectDetailPopulate]);
    return this.buildProjectDetail(project);
  }

  async removeSectionForWorkspace(
    context: WorkspaceContext,
    projectId: string,
    sectionId: string,
  ): Promise<ProjectDetailDto> {
    const project = await this.findProjectInWorkspace(context.workspace.id, projectId);
    await this.assertProjectEditor(project.id, context.user.id);
    const sectionCount = await this.entityManager.count(Section, { project: projectId });
    if (sectionCount <= 1) {
      throw new BadRequestException('El proyecto debe tener al menos una sección');
    }
    const section = await this.findSectionInProject(projectId, sectionId);
    this.entityManager.remove(section);
    await this.entityManager.flush();
    await this.entityManager.populate(project, [...this.projectDetailPopulate]);
    return this.buildProjectDetail(project);
  }

  async reorderSectionsForWorkspace(
    context: WorkspaceContext,
    projectId: string,
    reorderSectionsDto: ReorderSectionsDto,
  ): Promise<ProjectDetailDto> {
    const project = await this.findProjectInWorkspace(context.workspace.id, projectId);
    await this.assertProjectEditor(project.id, context.user.id);
    const sections = await this.entityManager.find(Section, { project: projectId });
    const sectionById = new Map(sections.map((section) => [section.id, section]));
    for (const update of reorderSectionsDto.sections) {
      const section = sectionById.get(update.sectionId);
      if (!section) {
        throw new NotFoundException(`Sección no encontrada: ${update.sectionId}`);
      }
      section.position = update.position;
    }
    await this.entityManager.flush();
    await this.entityManager.populate(project, [...this.projectDetailPopulate]);
    return this.buildProjectDetail(project);
  }

  async addMemberByUserId(
    context: WorkspaceContext,
    projectId: string,
    addProjectMemberDto: AddProjectMemberDto,
  ): Promise<ProjectDetailDto> {
    if (addProjectMemberDto.userId === context.user.id) {
      throw new BadRequestException('No puedes añadirte a ti mismo');
    }
    const project = await this.findProjectInWorkspace(context.workspace.id, projectId);
    await this.assertProjectAdmin(project.id, context.user.id);
    const workspaceMember = await this.entityManager.findOne(WorkspaceMember, {
      workspace: context.workspace.id,
      user: addProjectMemberDto.userId,
    });
    if (!workspaceMember) {
      throw new BadRequestException('El usuario no pertenece a este workspace');
    }
    const existingMember = await this.entityManager.findOne(ProjectMember, {
      project: projectId,
      user: addProjectMemberDto.userId,
    });
    if (existingMember) {
      throw new BadRequestException('Esta persona ya es miembro del proyecto');
    }
    const memberUser = await this.entityManager.findOneOrFail(User, {
      id: addProjectMemberDto.userId,
    });
    const memberRole = addProjectMemberDto.role ?? ProjectAccessRole.EDITOR;
    this.entityManager.create(ProjectMember, {
      project,
      user: memberUser,
      role: memberRole,
    });
    await this.entityManager.flush();
    return this.reloadProjectDetail(projectId);
  }

  async addMembersFromTeam(
    context: WorkspaceContext,
    projectId: string,
    addProjectMembersFromTeamDto: AddProjectMembersFromTeamDto,
  ): Promise<AddProjectMembersFromTeamResponseDto> {
    const project = await this.findProjectInWorkspace(context.workspace.id, projectId);
    await this.assertProjectAdmin(project.id, context.user.id);
    const sourceTeam = await this.entityManager.findOne(Team, {
      id: addProjectMembersFromTeamDto.sourceTeamId,
      workspace: context.workspace.id,
    });
    if (!sourceTeam) {
      throw new NotFoundException('Equipo no encontrado');
    }
    await this.entityManager.populate(sourceTeam, ['members.user']);
    const existingMemberIds = new Set(
      (
        await this.entityManager.find(ProjectMember, { project: projectId }, { populate: ['user'] })
      ).map((member) => member.user.id),
    );
    const memberRole = addProjectMembersFromTeamDto.role ?? ProjectAccessRole.EDITOR;
    let addedCount = 0;
    for (const sourceMember of sourceTeam.members.getItems()) {
      if (existingMemberIds.has(sourceMember.user.id)) {
        continue;
      }
      this.entityManager.create(ProjectMember, {
        project,
        user: sourceMember.user,
        role: memberRole,
      });
      existingMemberIds.add(sourceMember.user.id);
      addedCount += 1;
    }
    await this.entityManager.flush();
    return {
      addedCount,
      message:
        addedCount > 0
          ? `Se añadieron ${addedCount} miembros desde ${sourceTeam.name}`
          : 'No había miembros nuevos para añadir',
    };
  }

  async updateMemberRoleForWorkspace(
    context: WorkspaceContext,
    projectId: string,
    userId: string,
    updateProjectMemberRoleDto: UpdateProjectMemberRoleDto,
  ): Promise<ProjectDetailDto> {
    const project = await this.findProjectInWorkspace(context.workspace.id, projectId);
    await this.assertProjectAdmin(project.id, context.user.id);
    await this.entityManager.populate(project, ['createdBy']);
    const member = await this.entityManager.findOne(
      ProjectMember,
      { project: projectId, user: userId },
      { populate: ['user'] },
    );
    if (!member) {
      throw new NotFoundException('Miembro no encontrado');
    }
    if (project.createdBy.id === userId) {
      throw new BadRequestException('No puedes cambiar el rol del creador del proyecto');
    }
    member.role = updateProjectMemberRoleDto.role;
    await this.entityManager.flush();
    return this.reloadProjectDetail(projectId);
  }

  async removeMemberForWorkspace(
    context: WorkspaceContext,
    projectId: string,
    userId: string,
  ): Promise<ProjectDetailDto> {
    const project = await this.findProjectInWorkspace(context.workspace.id, projectId);
    await this.assertProjectAdmin(project.id, context.user.id);
    await this.entityManager.populate(project, ['createdBy']);
    const member = await this.entityManager.findOne(ProjectMember, {
      project: projectId,
      user: userId,
    });
    if (!member) {
      throw new NotFoundException('Miembro no encontrado');
    }
    if (project.createdBy.id === userId) {
      throw new BadRequestException('No puedes eliminar al creador del proyecto');
    }
    const memberCount = await this.entityManager.count(ProjectMember, {
      project: projectId,
    });
    if (memberCount <= 1) {
      throw new BadRequestException('El proyecto debe tener al menos un miembro');
    }
    this.entityManager.remove(member);
    await this.entityManager.flush();
    return this.reloadProjectDetail(projectId);
  }

  private async reloadProjectDetail(projectId: string): Promise<ProjectDetailDto> {
    const project = await this.entityManager.findOneOrFail(
      Project,
      { id: projectId },
      { populate: ['team', 'createdBy', 'members.user', 'sections'] },
    );
    return this.buildProjectDetail(project);
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

  private async resolveNextSectionPosition(projectId: string): Promise<number> {
    const sections = await this.entityManager.find(
      Section,
      { project: projectId },
      { orderBy: { position: 'DESC' }, limit: 1 },
    );
    const lastSection = sections[0];
    if (!lastSection) {
      return DEFAULT_SECTION_POSITION;
    }
    return lastSection.position + SECTION_POSITION_GAP;
  }

  private async assertProjectEditor(projectId: string, userId: string): Promise<void> {
    const member = await this.entityManager.findOne(ProjectMember, {
      project: projectId,
      user: userId,
    });
    if (
      !member ||
      (member.role !== ProjectAccessRole.ADMIN &&
        member.role !== ProjectAccessRole.EDITOR)
    ) {
      throw new ForbiddenException(
        'No tienes permiso para modificar las secciones de este proyecto',
      );
    }
  }

  private async findProjectInWorkspace(
    workspaceId: string,
    projectId: string,
  ): Promise<Project> {
    const project = await this.entityManager.findOne(
      Project,
      { id: projectId, workspace: workspaceId },
      { populate: ['team', 'createdBy', 'members', 'sections'] },
    );
    if (!project) {
      throw new NotFoundException('Proyecto no encontrado');
    }
    return project;
  }

  private async assertProjectAdmin(projectId: string, userId: string): Promise<void> {
    const member = await this.entityManager.findOne(ProjectMember, {
      project: projectId,
      user: userId,
    });
    if (!member || member.role !== ProjectAccessRole.ADMIN) {
      throw new ForbiddenException('Solo los administradores del proyecto pueden hacer esto');
    }
  }

  private toSummary(project: Project): ProjectSummaryDto {
    const memberCount = project.members.isInitialized() ? project.members.length : 0;
    const sectionCount = project.sections.isInitialized() ? project.sections.length : 0;
    return {
      id: project.id,
      name: project.name,
      description: project.description,
      color: project.color ? this.toDtoColor(project.color) : null,
      status: this.toDtoStatus(project.status),
      teamId: project.team.id,
      teamName: project.team.name,
      memberCount,
      sectionCount,
      createdAt: project.createdAt?.toISOString() ?? new Date().toISOString(),
    };
  }

  private toDetail(project: Project): ProjectDetailDto {
    const memberItems = project.members.isInitialized()
      ? project.members.getItems()
      : [];
    const ownerUserId = project.createdBy?.id ?? '';
    const members = memberItems
      .map((member) => this.toMember(member, ownerUserId))
      .sort((left, right) => left.name.localeCompare(right.name));
    const sections = (project.sections.isInitialized()
      ? project.sections.getItems()
      : []
    )
      .map((section) => this.toSection(section))
      .sort((left, right) => left.position - right.position);
    const listColumns = (project.listColumns.isInitialized()
      ? project.listColumns.getItems()
      : []
    )
      .map((column) => this.toListColumn(column))
      .sort((left, right) => left.position - right.position);
    return {
      ...this.toSummary(project),
      memberCount: members.length,
      sectionCount: sections.length,
      members,
      sections,
      listColumns,
      customFields: [],
    };
  }

  private async buildProjectDetail(project: Project): Promise<ProjectDetailDto> {
    const detail = this.toDetail(project);
    const customFields = await this.customFieldsService.listDefinitionsForProject(
      this.entityManager,
      project.id,
    );
    return { ...detail, customFields };
  }

  private toListColumn(column: ProjectListColumn): ProjectListColumnDto {
    return {
      id: column.id,
      fieldKey: column.fieldKey as ProjectListFieldKey | null,
      customFieldId: column.customField?.id ?? null,
      position: column.position,
      visible: column.visible,
      width: column.width,
    };
  }

  private seedDefaultListColumns(
    em: EntityManager,
    project: Project,
  ): void {
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

  private async ensureListColumns(project: Project): Promise<void> {
    const count = await this.entityManager.count(ProjectListColumn, {
      project: project.id,
    });
    if (count > 0) {
      return;
    }
    this.seedDefaultListColumns(this.entityManager, project);
    await this.entityManager.flush();
  }

  private toMember(member: ProjectMember, ownerUserId: string): ProjectMemberDto {
    return {
      userId: member.user.id,
      name: member.user.name,
      email: member.user.email,
      role: this.toDtoRole(member.role),
      isOwner: member.user.id === ownerUserId,
      joinedAt: member.joinedAt?.toISOString() ?? new Date().toISOString(),
    };
  }

  private toSection(section: Section): ProjectSectionDto {
    return {
      id: section.id,
      name: section.name,
      position: section.position,
      createdAt: section.createdAt?.toISOString() ?? new Date().toISOString(),
    };
  }

  private toDtoRole(role: ProjectAccessRole): ProjectAccessRoleDto {
    return role as ProjectAccessRoleDto;
  }

  private toDtoColor(color: ProjectColor): ProjectColorDto {
    return color as ProjectColorDto;
  }

  private toEntityColor(color: ProjectColorDto): ProjectColor {
    if (!Object.values(ProjectColor).includes(color as ProjectColor)) {
      throw new BadRequestException('Color de proyecto no válido');
    }
    return color as ProjectColor;
  }

  private toDtoStatus(status: ProjectStatus): ProjectStatusDto {
    return status as ProjectStatusDto;
  }

  private toEntityStatus(status: ProjectStatusDto): ProjectStatus {
    if (!Object.values(ProjectStatus).includes(status as ProjectStatus)) {
      throw new BadRequestException('Estado de proyecto no válido');
    }
    return status as ProjectStatus;
  }
}
