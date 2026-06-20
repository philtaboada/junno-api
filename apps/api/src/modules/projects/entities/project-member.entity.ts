import { Entity, Enum, ManyToOne, PrimaryKey, Property, Unique } from '@mikro-orm/decorators/legacy';
import { User } from '../../auth/entities/user.entity';
import { Project } from './project.entity';

export enum ProjectAccessRole {
  ADMIN = 'admin',
  EDITOR = 'editor',
  COMMENTER = 'commenter',
  VIEWER = 'viewer',
}

@Entity({ tableName: 'project_members' })
@Unique({ properties: ['project', 'user'] })
export class ProjectMember {
  @PrimaryKey({ type: 'uuid', defaultRaw: 'gen_random_uuid()' })
  id!: string;

  @ManyToOne(() => Project, { fieldName: 'project_id' })
  project!: Project;

  @ManyToOne(() => User, { fieldName: 'user_id' })
  user!: User;

  @Enum({ items: () => ProjectAccessRole })
  role: ProjectAccessRole = ProjectAccessRole.EDITOR;

  @Property({ fieldName: 'joined_at', onCreate: () => new Date(), type: 'Date' })
  joinedAt?: Date;
}
