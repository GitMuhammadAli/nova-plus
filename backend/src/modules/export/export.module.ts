import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ExportService } from './export.service';
import { ExportController } from './export.controller';
import { User, UserSchema } from '../user/entities/user.entity';
import { Task, TaskSchema } from '../task/entities/task.entity';
import { Project, ProjectSchema } from '../project/entities/project.entity';
import { AuditLog, AuditLogSchema } from '../audit/entities/audit-log.entity';
import {
  AnalyticsVisit,
  AnalyticsVisitSchema,
} from '../analytics/entities/analytics-visit.entity';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: User.name, schema: UserSchema },
      { name: Task.name, schema: TaskSchema },
      { name: Project.name, schema: ProjectSchema },
      { name: AuditLog.name, schema: AuditLogSchema },
      { name: AnalyticsVisit.name, schema: AnalyticsVisitSchema },
    ]),
  ],
  controllers: [ExportController],
  providers: [ExportService],
  exports: [ExportService],
})
export class ExportModule {}
