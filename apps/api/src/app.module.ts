import { join } from 'path';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { IntegrationsModule } from './modules/integrations/integrations.module';
import { AutomationModule } from './modules/automation/automation.module';
import { FormsModule } from './modules/forms/forms.module';
import { DashboardsModule } from './modules/dashboards/dashboards.module';
import { PortfoliosModule } from './modules/portfolios/portfolios.module';
import { ProjectTemplatesModule } from './modules/project-templates/project-templates.module';
import { AuthModule } from './modules/auth/auth.module';
import { CommentsModule } from './modules/comments/comments.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { ProjectsModule } from './modules/projects/projects.module';
import { RealtimeModule } from './modules/realtime/realtime.module';
import { TasksModule } from './modules/tasks/tasks.module';
import { TeamsModule } from './modules/teams/teams.module';
import { WorkspacesModule } from './modules/workspaces/workspaces.module';
import mikroOrmConfig from '../mikro-orm.config';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      ignoreEnvFile: process.env.NODE_ENV === 'production',
      envFilePath: [
        join(__dirname, '..', '..', '..', '.env'),
        join(__dirname, '..', '..', '..', '.env.local'),
      ],
    }),
    MikroOrmModule.forRoot({
      ...mikroOrmConfig,
      allowGlobalContext: true,
    }),
    AuthModule,
    AutomationModule,
    IntegrationsModule,
    FormsModule,
    DashboardsModule,
    PortfoliosModule,
    ProjectTemplatesModule,
    WorkspacesModule,
    TeamsModule,
    ProjectsModule,
    TasksModule,
    CommentsModule,
    RealtimeModule,
    NotificationsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
