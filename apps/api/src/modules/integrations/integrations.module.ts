import { Module } from '@nestjs/common';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { AuthModule } from '../auth/auth.module';
import { ProjectMember } from '../projects/entities/project-member.entity';
import { Project } from '../projects/entities/project.entity';
import { WorkspacesModule } from '../workspaces/workspaces.module';
import { IntegrationDeliveryLog } from './entities/integration-delivery-log.entity';
import { ProjectIntegration } from './entities/project-integration.entity';
import { IntegrationDeliveryService } from './integration-delivery.service';
import { IntegrationPayloadService } from './integration-payload.service';
import { IntegrationProcessorService } from './integration-processor.service';
import { IntegrationQueueService } from './integration-queue.service';
import { IntegrationTriggerService } from './integration-trigger.service';
import {
  IntegrationsController,
  ProjectIntegrationsController,
  PublicSlackOAuthController,
} from './integrations.controller';
import { IntegrationsService } from './integrations.service';
import { PublicKapsoWebhooksController } from './public-kapso-webhooks.controller';
import { SlackOAuthService } from './slack-oauth.service';

@Module({
  imports: [
    MikroOrmModule.forFeature([
      ProjectIntegration,
      IntegrationDeliveryLog,
      Project,
      ProjectMember,
    ]),
    AuthModule,
    WorkspacesModule,
  ],
  controllers: [
    ProjectIntegrationsController,
    IntegrationsController,
    PublicSlackOAuthController,
    PublicKapsoWebhooksController,
  ],
  providers: [
    IntegrationsService,
    SlackOAuthService,
    IntegrationQueueService,
    IntegrationProcessorService,
    IntegrationPayloadService,
    IntegrationDeliveryService,
    IntegrationTriggerService,
  ],
  exports: [IntegrationTriggerService],
})
export class IntegrationsModule {}
