import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ManagerController } from './manager.controller';
import { ManagerService } from './manager.service';
import { ManagerProjectsService } from './projects/manager-projects.service';
import { ManagerTasksService } from './tasks/manager-tasks.service';
import { ManagerTeamService } from './team/manager-team.service';
import { ManagerStatsService } from './stats/manager-stats.service';
import { Project, ProjectSchema } from '../project/entities/project.entity';
import { Task, TaskSchema } from '../task/entities/task.entity';
import { User, UserSchema } from '../user/entities/user.entity';
import { Department, DepartmentSchema } from '../department/entities/department.entity';
import { AuditModule } from '../audit/audit.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Project.name, schema: ProjectSchema },
      { name: Task.name, schema: TaskSchema },
      { name: User.name, schema: UserSchema },
      { name: Department.name, schema: DepartmentSchema },
    ]),
    AuditModule,
  ],
  controllers: [ManagerController],
  providers: [
    ManagerService,
    ManagerProjectsService,
    ManagerTasksService,
    ManagerTeamService,
    ManagerStatsService,
  ],
  exports: [
    ManagerService,
    ManagerProjectsService,
    ManagerTasksService,
    ManagerTeamService,
    ManagerStatsService,
  ],
})
export class ManagerModule {}

