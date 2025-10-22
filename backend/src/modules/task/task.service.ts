import { Injectable, ForbiddenException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Task, TaskDocument } from './entities/task.entity';
import { CreateTaskDto } from './dto/create-task.dto';
import { UserRole, UserDocument } from 'src/modules/user/entities/user.entity';

@Injectable()
export class TasksService {
  constructor(@InjectModel(Task.name) private taskModel: Model<TaskDocument>) {}

  async create(createTaskDto: CreateTaskDto, user: UserDocument) {
    if (user.role !== UserRole.MANAGER && user.role !== UserRole.ADMIN) {
      throw new ForbiddenException('Only managers or admins can create tasks.');
    }

    const task = new this.taskModel({
      ...createTaskDto,
      assignedBy: user._id,
    });

    return task.save();
  }

  async findMyTasks(user: UserDocument) {
    return this.taskModel.find({ assignedTo: user._id }).populate('assignedBy');
  }

  async updateStatus(taskId: string, status: string, user: UserDocument) {
    const task = await this.taskModel.findById(taskId);
    if (!task) throw new ForbiddenException('Task not found.');

    // only assignee or manager/admin can change status
    if (
      task.assignedTo.toString() !== user._id?.toString() &&
      user.role === UserRole.USER
    ) {
      throw new ForbiddenException('Not allowed to update this task.');
    }

    task.status = status as any;
    return task.save();
  }
}
