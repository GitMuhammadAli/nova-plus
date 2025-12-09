import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { User, UserSchema } from './entities/user.entity';
import { Organization, OrganizationSchema } from '../organization/entities/organization.entity';
import { Company, CompanySchema } from '../company/entities/company.entity';
import { Task, TaskSchema } from '../task/entities/task.entity';
import { Project, ProjectSchema } from '../project/entities/project.entity';
import { UsersService } from './user.service';
import { UserController } from './user.controller';
import { UsersController } from './users.controller';
import { UserTasksService } from './tasks/user-tasks.service';
import { UserProjectsService } from './projects/user-projects.service';
import { UserStatsService } from './stats/user-stats.service';
import { TestDataSeed } from './seed/test-data.seed';
import { AuditModule } from '../audit/audit.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: User.name, schema: UserSchema },
      { name: Organization.name, schema: OrganizationSchema },
      { name: Company.name, schema: CompanySchema },
      { name: Task.name, schema: TaskSchema },
      { name: Project.name, schema: ProjectSchema },
    ]),
    AuditModule,
  ],
  providers: [
    UsersService,
    UserTasksService,
    UserProjectsService,
    UserStatsService,
    TestDataSeed,
  ],
  controllers: [UserController, UsersController],
  exports: [UsersService, UserTasksService, UserProjectsService, UserStatsService],
})
export class UsersModule {}
