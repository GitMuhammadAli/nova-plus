import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Task, TaskSchema } from './entities/task.entity';
import { TasksService } from './task.service';
import { TasksController } from './task.controller';
import { User, UserSchema } from '../user/entities/user.entity';
import { Project, ProjectSchema } from '../project/entities/project.entity';
import { Company, CompanySchema } from '../company/entities/company.entity';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Task.name, schema: TaskSchema },
      { name: User.name, schema: UserSchema },
      { name: Project.name, schema: ProjectSchema },
      { name: Company.name, schema: CompanySchema },
    ]),
  ],
  controllers: [TasksController],
  providers: [TasksService],
  exports: [TasksService],
})
export class TasksModule {}
