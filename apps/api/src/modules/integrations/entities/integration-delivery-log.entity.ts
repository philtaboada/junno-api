import { Entity, ManyToOne, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { Workspace } from '../../workspaces/entities/workspace.entity';
import { ProjectIntegration } from './project-integration.entity';

export enum IntegrationDeliveryStatus {
  SUCCESS = 'success',
  FAILED = 'failed',
}

@Entity({ tableName: 'integration_delivery_logs' })
export class IntegrationDeliveryLog {
  @PrimaryKey({ type: 'uuid', defaultRaw: 'gen_random_uuid()' })
  id!: string;

  @ManyToOne(() => Workspace, { fieldName: 'workspace_id' })
  workspace!: Workspace;

  @ManyToOne(() => ProjectIntegration, { fieldName: 'integration_id' })
  integration!: ProjectIntegration;

  @Property({ fieldName: 'event_type', type: 'string' })
  eventType!: string;

  @Property({ type: 'string' })
  status!: IntegrationDeliveryStatus;

  @Property({ fieldName: 'response_code', nullable: true, type: 'int' })
  responseCode: number | null = null;

  @Property({ fieldName: 'error_message', nullable: true, type: 'text' })
  errorMessage: string | null = null;

  @Property({ fieldName: 'created_at', onCreate: () => new Date(), type: 'Date' })
  createdAt?: Date;
}
