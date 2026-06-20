import { Entity, Enum, ManyToOne, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { User } from '../../auth/entities/user.entity';
import { Project } from '../../projects/entities/project.entity';
import { Workspace } from '../../workspaces/entities/workspace.entity';

export enum IntegrationType {
  WEBHOOK = 'webhook',
  SLACK = 'slack',
  WHATSAPP_KAPSO = 'whatsapp_kapso',
}

@Entity({ tableName: 'project_integrations' })
export class ProjectIntegration {
  @PrimaryKey({ type: 'uuid', defaultRaw: 'gen_random_uuid()' })
  id!: string;

  @ManyToOne(() => Workspace, { fieldName: 'workspace_id' })
  workspace!: Workspace;

  @ManyToOne(() => Project, { fieldName: 'project_id' })
  project!: Project;

  @Enum({ items: () => IntegrationType })
  type!: IntegrationType;

  @Property({ type: 'string' })
  name!: string;

  @Property({ type: 'json', default: '[]' })
  events: string[] = [];

  @Property({ type: 'json', default: '{}' })
  config: Record<string, unknown> = {};

  @Property({ fieldName: 'is_active', type: 'boolean' })
  isActive = true;

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
}
