import 'reflect-metadata';
import { defineConfig } from '@mikro-orm/postgresql';
import { PasswordResetToken } from './src/modules/auth/entities/password-reset-token.entity';
import { RefreshToken } from './src/modules/auth/entities/refresh-token.entity';
import { User } from './src/modules/auth/entities/user.entity';
import { Comment } from './src/modules/comments/entities/comment.entity';
import { ActivityEvent } from './src/modules/notifications/entities/activity-event.entity';
import { AutomationRule } from './src/modules/automation/entities/automation-rule.entity';
import { AutomationRun } from './src/modules/automation/entities/automation-run.entity';
import { IntegrationDeliveryLog } from './src/modules/integrations/entities/integration-delivery-log.entity';
import { ProjectIntegration } from './src/modules/integrations/entities/project-integration.entity';
import { FormField } from './src/modules/forms/entities/form-field.entity';
import { ProjectForm } from './src/modules/forms/entities/project-form.entity';
import { DashboardWidget } from './src/modules/dashboards/entities/dashboard-widget.entity';
import { Dashboard } from './src/modules/dashboards/entities/dashboard.entity';
import { GoalMetricSnapshot } from './src/modules/portfolios/entities/goal-metric-snapshot.entity';
import { Goal } from './src/modules/portfolios/entities/goal.entity';
import { PortfolioProject } from './src/modules/portfolios/entities/portfolio-project.entity';
import { Portfolio } from './src/modules/portfolios/entities/portfolio.entity';
import { ProjectTemplateCustomField } from './src/modules/project-templates/entities/project-template-custom-field.entity';
import { ProjectTemplateSection } from './src/modules/project-templates/entities/project-template-section.entity';
import { ProjectTemplateTask } from './src/modules/project-templates/entities/project-template-task.entity';
import { ProjectTemplate } from './src/modules/project-templates/entities/project-template.entity';
import { MyTasksListColumn } from './src/modules/tasks/entities/my-tasks-list-column.entity';
import { TaskAttachment } from './src/modules/tasks/entities/task-attachment.entity';
import { TaskDependency } from './src/modules/tasks/entities/task-dependency.entity';
import { TaskMembership } from './src/modules/tasks/entities/task-membership.entity';
import { Task } from './src/modules/tasks/entities/task.entity';
import { CustomFieldDefinition } from './src/modules/projects/entities/custom-field-definition.entity';
import { CustomFieldValue } from './src/modules/projects/entities/custom-field-value.entity';
import { ProjectListColumn } from './src/modules/projects/entities/project-list-column.entity';
import { ProjectMember } from './src/modules/projects/entities/project-member.entity';
import { Project } from './src/modules/projects/entities/project.entity';
import { Section } from './src/modules/projects/entities/section.entity';
import { TeamInvitation } from './src/modules/teams/entities/team-invitation.entity';
import { TeamNotificationPreference } from './src/modules/teams/entities/team-notification-preference.entity';
import { TeamMember } from './src/modules/teams/entities/team-member.entity';
import { Team } from './src/modules/teams/entities/team.entity';
import { WorkspaceMember } from './src/modules/workspaces/entities/workspace-member.entity';
import { Workspace } from './src/modules/workspaces/entities/workspace.entity';

function resolveDatabaseDriverOptions(): { connection: { ssl?: { rejectUnauthorized: boolean } } } | undefined {
  const databaseUrl = process.env.DATABASE_URL ?? '';
  const isProduction = process.env.NODE_ENV === 'production';
  const usesRemoteDatabase = databaseUrl.includes('supabase.com') || databaseUrl.includes('railway.app');
  if (!isProduction && !usesRemoteDatabase) {
    return undefined;
  }
  return {
    connection: {
      ssl: { rejectUnauthorized: false },
    },
  };
}

export default defineConfig({
  clientUrl:
    process.env.DATABASE_URL ??
    'postgresql://pm:pm_dev_password@localhost:5432/project_management',
  driverOptions: resolveDatabaseDriverOptions(),
  entities: [
    User,
    Workspace,
    WorkspaceMember,
    RefreshToken,
    PasswordResetToken,
    Team,
    TeamMember,
    TeamInvitation,
    TeamNotificationPreference,
    Project,
    ProjectListColumn,
    CustomFieldDefinition,
    CustomFieldValue,
    Section,
    ProjectMember,
    ActivityEvent,
    AutomationRule,
    AutomationRun,
    ProjectForm,
    FormField,
    ProjectIntegration,
    IntegrationDeliveryLog,
    Dashboard,
    DashboardWidget,
    Portfolio,
    PortfolioProject,
    Goal,
    GoalMetricSnapshot,
    ProjectTemplate,
    ProjectTemplateSection,
    ProjectTemplateCustomField,
    ProjectTemplateTask,
    Task,
    TaskMembership,
    TaskAttachment,
    TaskDependency,
    MyTasksListColumn,
    Comment,
  ],
  migrations: {
    path: 'dist/migrations',
    pathTs: 'src/migrations',
    glob: '!(*.d).{js,ts}',
  },
  debug: process.env.NODE_ENV === 'development',
  dynamicImportProvider: (id: string) => import(id),
});
