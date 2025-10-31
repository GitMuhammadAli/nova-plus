import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { DashboardService } from './dashboard.service';
import { DashboardController, ActivityController } from './dashboard.controller';
import { User, UserSchema } from '../user/entities/user.entity';
import { Task, TaskSchema } from '../task/entities/task.entity';
import { Activity, ActivitySchema } from './entities/activity.entity';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: User.name, schema: UserSchema },
      { name: Task.name, schema: TaskSchema },
      { name: Activity.name, schema: ActivitySchema },
    ]),
  ],
  controllers: [DashboardController, ActivityController],
  providers: [DashboardService],
  exports: [DashboardService],
})
export class DashboardModule {}

