import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AnalyticsService } from './analytics.service';
import { AnalyticsController } from './analytics.controller';
import { User, UserSchema } from '../user/entities/user.entity';
import { Project, ProjectSchema } from '../project/entities/project.entity';
import { Task, TaskSchema } from '../task/entities/task.entity';
import { Invite, InviteSchema } from '../invite/entities/invite.entity';
import {
  AnalyticsVisit,
  AnalyticsVisitSchema,
} from './entities/analytics-visit.entity';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: User.name, schema: UserSchema },
      { name: Project.name, schema: ProjectSchema },
      { name: Task.name, schema: TaskSchema },
      { name: Invite.name, schema: InviteSchema },
      { name: AnalyticsVisit.name, schema: AnalyticsVisitSchema },
    ]),
  ],
  controllers: [AnalyticsController],
  providers: [AnalyticsService],
  exports: [AnalyticsService],
})
export class AnalyticsModule {}
