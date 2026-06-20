import { Collection } from '@mikro-orm/core';
import {
  Entity,
  Enum,
  ManyToOne,
  OneToMany,
  PrimaryKey,
  Property,
} from '@mikro-orm/decorators/legacy';
import { User } from '../../auth/entities/user.entity';
import { Team } from '../../teams/entities/team.entity';
import { Workspace } from '../../workspaces/entities/workspace.entity';
import { ProjectMember } from './project-member.entity';
import { ProjectListColumn } from './project-list-column.entity';
import { Section } from './section.entity';

export enum ProjectColor {
  CORAL = 'coral',
  INDIGO = 'indigo',
  EMERALD = 'emerald',
  AMBER = 'amber',
  ROSE = 'rose',
  SKY = 'sky',
  SLATE = 'slate',
  VIOLET = 'violet',
}

export enum ProjectStatus {
  ACTIVE = 'active',
  ARCHIVED = 'archived',
}

@Entity({ tableName: 'projects' })
export class Project {
  @PrimaryKey({ type: 'uuid', defaultRaw: 'gen_random_uuid()' })
  id!: string;

  @ManyToOne(() => Workspace, { fieldName: 'workspace_id' })
  workspace!: Workspace;

  @ManyToOne(() => Team, { fieldName: 'team_id' })
  team!: Team;

  @Property({ type: 'string' })
  name!: string;

  @Property({ nullable: true, type: 'text' })
  description: string | null = null;

  @Enum({ items: () => ProjectColor, nullable: true })
  color: ProjectColor | null = null;

  @Enum({ items: () => ProjectStatus })
  status: ProjectStatus = ProjectStatus.ACTIVE;

  @ManyToOne(() => User, { fieldName: 'created_by_id' })
  createdBy!: User;

  @Property({ fieldName: 'created_at', onCreate: () => new Date(), type: 'Date' })
  createdAt?: Date;

  @Property({
    fieldName: 'updated_at',
    onCreate: () => new Date(),
    onUpdate: () => new Date(),
    type: 'Date',
  })
  updatedAt?: Date;

  @OneToMany(() => ProjectMember, (member) => member.project)
  members = new Collection<ProjectMember>(this);

  @OneToMany(() => Section, (section) => section.project)
  sections = new Collection<Section>(this);

  @OneToMany(() => ProjectListColumn, (column) => column.project)
  listColumns = new Collection<ProjectListColumn>(this);
}
