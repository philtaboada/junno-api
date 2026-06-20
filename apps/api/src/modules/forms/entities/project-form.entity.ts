import { Collection } from '@mikro-orm/core';
import {
  Entity,
  ManyToOne,
  OneToMany,
  PrimaryKey,
  Property,
} from '@mikro-orm/decorators/legacy';
import { User } from '../../auth/entities/user.entity';
import { Project } from '../../projects/entities/project.entity';
import { Section } from '../../projects/entities/section.entity';
import { Workspace } from '../../workspaces/entities/workspace.entity';
import { FormField } from './form-field.entity';

@Entity({ tableName: 'project_forms' })
export class ProjectForm {
  @PrimaryKey({ type: 'uuid', defaultRaw: 'gen_random_uuid()' })
  id!: string;

  @ManyToOne(() => Workspace, { fieldName: 'workspace_id' })
  workspace!: Workspace;

  @ManyToOne(() => Project, { fieldName: 'project_id' })
  project!: Project;

  @Property({ type: 'string' })
  name!: string;

  @Property({ nullable: true, type: 'text' })
  description: string | null = null;

  @Property({ fieldName: 'public_slug', type: 'string', unique: true })
  publicSlug!: string;

  @Property({ fieldName: 'is_public', type: 'boolean' })
  isPublic = false;

  @Property({ fieldName: 'is_active', type: 'boolean' })
  isActive = true;

  @ManyToOne(() => Section, { fieldName: 'section_id', nullable: true })
  section: Section | null = null;

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

  @OneToMany(() => FormField, (field) => field.form)
  fields = new Collection<FormField>(this);
}
