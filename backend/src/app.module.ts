import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import configuration from './config/configuration';
import { validationSchema } from './config/validation';
import { HealthModule } from './modules/health/health.module';
import { AuthModule } from './modules/auth/auth.module';
import { TasksModule } from './modules/task/task.module';
import { TeamsModule } from './modules/team/team.module';
import { DashboardModule } from './modules/dashboard/dashboard.module';
import { OrganizationModule } from './modules/organization/organization.module';
import { UsersModule } from './modules/user/user.module';
import { CompanyModule } from './modules/company/company.module';
import { InviteModule } from './modules/invite/invite.module';
import { ProjectModule } from './modules/project/project.module';
import { EmailModule } from './modules/email/email.module';
import { AuditModule } from './modules/audit/audit.module';
import { DepartmentModule } from './modules/department/department.module';
import { AnalyticsModule } from './modules/analytics/analytics.module';
import { WorkflowModule } from './modules/workflow/workflow.module';
import { QueueModule } from './providers/queue/queue.module';
import { WebhookModule } from './modules/webhook/webhook.module';
import { CommonModule } from './common/common.module';
import { PrometheusService } from './common/metrics/prom-client';
import { MetricsController } from './common/controllers/metrics.controller';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
      validationSchema,
    }),
    // Scheduling
    ScheduleModule.forRoot(),
    // Rate Limiting
    ThrottlerModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => [
        {
          ttl: configService.get<number>('THROTTLE_TTL') || 60,
          limit: configService.get<number>('THROTTLE_LIMIT') || 100,
        },
      ],
      inject: [ConfigService],
    }),
    // MongoDB with Connection Pooling
    MongooseModule.forRootAsync({
      imports: [ConfigModule, TasksModule, TeamsModule],
      useFactory: (configService: ConfigService) => ({
        uri: configService.get<string>('mongoUri'),
        maxPoolSize: configService.get<number>('MONGO_MAX_POOL_SIZE') || 10,
        minPoolSize: configService.get<number>('MONGO_MIN_POOL_SIZE') || 2,
        maxIdleTimeMS: configService.get<number>('MONGO_MAX_IDLE_TIME_MS') || 30000,
        serverSelectionTimeoutMS: configService.get<number>('MONGO_SERVER_SELECTION_TIMEOUT') || 5000,
        socketTimeoutMS: configService.get<number>('MONGO_SOCKET_TIMEOUT') || 45000,
        retryWrites: true,
        w: 'majority',
      }),
      inject: [ConfigService],
    }),
    HealthModule,
    AuthModule,
    UsersModule,
    OrganizationModule,
    CompanyModule,
    InviteModule,
    DashboardModule,
    ProjectModule,
    TasksModule,
    EmailModule,
    AuditModule,
    DepartmentModule,
    AnalyticsModule,
    WorkflowModule,
    QueueModule,
    WebhookModule,
    CommonModule,
    AIModule,
  ],
  controllers: [],
  providers: [
    // Global Rate Limiting Guard (fallback to in-memory throttler)
    // Redis throttle guard is applied per-route where needed
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
