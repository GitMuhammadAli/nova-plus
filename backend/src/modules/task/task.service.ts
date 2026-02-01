import {
  Injectable,
  ForbiddenException,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import {
  Task,
  TaskDocument,
  TaskStatus,
  TaskPriority,
} from './entities/task.entity';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { UserRole, UserDocument, User } from '../user/entities/user.entity';
import { Project } from '../project/entities/project.entity';
import { Company } from '../company/entities/company.entity';

@Injectable()
export class TasksService {
  constructor(
    @InjectModel(Task.name) private taskModel: Model<TaskDocument>,
    @InjectModel(User.name) private userModel: Model<User>,
    @InjectModel(Project.name) private projectModel: Model<Project>,
    @InjectModel(Company.name) private companyModel: Model<Company>,
  ) {}

  async create(createTaskDto: CreateTaskDto, user: UserDocument) {
    // Only managers and admins can create tasks
    if (
      user.role !== UserRole.MANAGER &&
      user.role !== UserRole.COMPANY_ADMIN &&
      user.role !== UserRole.SUPER_ADMIN
    ) {
      throw new ForbiddenException('Only managers and admins can create tasks');
    }

    if (!user.companyId) {
      throw new BadRequestException('User must belong to a company');
    }

    // Verify assigned user belongs to the same company
    const assignedUser = await this.userModel
      .findById(createTaskDto.assignedTo)
      .exec();
    if (!assignedUser) {
      throw new NotFoundException('Assigned user not found');
    }
    const assignedUserCompanyId = assignedUser.companyId?.toString();
    const userCompanyId = user.companyId?.toString() || user.companyId;
    if (assignedUserCompanyId !== userCompanyId) {
      throw new BadRequestException(
        'Assigned user must belong to your company',
      );
    }

    // If projectId is provided, verify it exists and belongs to the company
    if (createTaskDto.projectId) {
      const project = await this.projectModel
        .findById(createTaskDto.projectId)
        .exec();
      if (!project) {
        throw new NotFoundException('Project not found');
      }
      const projectCompanyId = project.companyId?.toString();
      const userCompanyId = user.companyId?.toString();
      if (projectCompanyId !== userCompanyId) {
        throw new BadRequestException('Project must belong to your company');
      }
    }

    const task = new this.taskModel({
      title: createTaskDto.title,
      description: createTaskDto.description,
      projectId: createTaskDto.projectId,
      companyId: user.companyId,
      assignedBy: user._id,
      assignedTo: createTaskDto.assignedTo,
      team: createTaskDto.team,
      status: createTaskDto.status || TaskStatus.PENDING,
      priority: createTaskDto.priority || TaskPriority.MEDIUM,
      dueDate: createTaskDto.dueDate
        ? new Date(createTaskDto.dueDate)
        : undefined,
      isActive: true,
    });

    return task.save();
  }

  async findAll(
    user: UserDocument,
    filters?: { projectId?: string; status?: TaskStatus; assignedTo?: string },
  ) {
    if (!user.companyId) {
      throw new BadRequestException('User must belong to a company');
    }

    const query: any = { companyId: user.companyId, isActive: true };

    // Managers/admins can see all company tasks, users only see their own
    if (
      user.role === UserRole.USER ||
      user.role === UserRole.VIEWER ||
      user.role === UserRole.EDITOR
    ) {
      query.assignedTo = user._id;
    } else if (filters?.assignedTo) {
      query.assignedTo = filters.assignedTo;
    }

    if (filters?.projectId) {
      query.projectId = filters.projectId;
    }

    if (filters?.status) {
      query.status = filters.status;
    }

    return this.taskModel
      .find(query)
      .populate('assignedBy', 'name email')
      .populate('assignedTo', 'name email role')
      .populate('projectId', 'name')
      .sort({ createdAt: -1 })
      .exec();
  }

  async findOne(id: string, user: UserDocument) {
    const task = await this.taskModel
      .findById(id)
      .populate('assignedBy', 'name email')
      .populate('assignedTo', 'name email role')
      .populate('projectId', 'name description')
      .populate('comments.userId', 'name email')
      .exec();

    if (!task) {
      throw new NotFoundException('Task not found');
    }

    // Verify user belongs to the same company
    const userCompanyId = user.companyId?.toString();
    const taskCompanyId = task.companyId?.toString();
    if (userCompanyId !== taskCompanyId) {
      throw new ForbiddenException(
        'You can only access tasks from your company',
      );
    }

    // Users can only see tasks assigned to them
    if (
      (user.role === UserRole.USER ||
        user.role === UserRole.VIEWER ||
        user.role === UserRole.EDITOR) &&
      task.assignedTo.toString() !== user._id?.toString()
    ) {
      throw new ForbiddenException('You can only view tasks assigned to you');
    }

    return task;
  }

  async update(id: string, updateTaskDto: UpdateTaskDto, user: UserDocument) {
    const task = await this.taskModel.findById(id).exec();

    if (!task) {
      throw new NotFoundException('Task not found');
    }

    // Verify user belongs to the same company
    const userCompanyId = user.companyId?.toString();
    const taskCompanyId = task.companyId?.toString();
    if (userCompanyId !== taskCompanyId) {
      throw new ForbiddenException(
        'You can only update tasks from your company',
      );
    }

    const isAssignedUser = task.assignedTo.toString() === user._id?.toString();
    const isManagerOrAdmin =
      user.role === UserRole.MANAGER ||
      user.role === UserRole.COMPANY_ADMIN ||
      user.role === UserRole.SUPER_ADMIN;

    // Only managers/admins can update most fields, but assigned users can update status and add comments
    if (updateTaskDto.assignedTo && !isManagerOrAdmin) {
      throw new ForbiddenException(
        'Only managers and admins can reassign tasks',
      );
    }

    if (updateTaskDto.projectId && !isManagerOrAdmin) {
      throw new ForbiddenException(
        'Only managers and admins can change project',
      );
    }

    // Prepare update data
    const updateData: any = {};
    if (updateTaskDto.title) updateData.title = updateTaskDto.title;
    if (updateTaskDto.description !== undefined)
      updateData.description = updateTaskDto.description;
    if (updateTaskDto.assignedTo && isManagerOrAdmin)
      updateData.assignedTo = updateTaskDto.assignedTo;
    if (updateTaskDto.projectId && isManagerOrAdmin)
      updateData.projectId = updateTaskDto.projectId;
    if (updateTaskDto.status) updateData.status = updateTaskDto.status;
    if (updateTaskDto.priority) updateData.priority = updateTaskDto.priority;
    if (updateTaskDto.dueDate)
      updateData.dueDate = new Date(updateTaskDto.dueDate);

    return this.taskModel
      .findByIdAndUpdate(id, updateData, { new: true })
      .populate('assignedBy', 'name email')
      .populate('assignedTo', 'name email role')
      .populate('projectId', 'name')
      .exec();
  }

  async remove(id: string, user: UserDocument) {
    if (
      user.role !== UserRole.MANAGER &&
      user.role !== UserRole.COMPANY_ADMIN &&
      user.role !== UserRole.SUPER_ADMIN
    ) {
      throw new ForbiddenException('Only managers and admins can delete tasks');
    }

    const task = await this.taskModel.findById(id).exec();

    if (!task) {
      throw new NotFoundException('Task not found');
    }

    // Verify user belongs to the same company
    const userCompanyId = user.companyId?.toString();
    const taskCompanyId = task.companyId?.toString();
    if (userCompanyId !== taskCompanyId) {
      throw new ForbiddenException(
        'You can only delete tasks from your company',
      );
    }

    // Soft delete
    task.isActive = false;
    return task.save();
  }

  async findMyTasks(user: UserDocument) {
    return this.taskModel
      .find({
        assignedTo: user._id,
        isActive: true,
        companyId: user.companyId,
      })
      .populate('assignedBy', 'name email')
      .populate('projectId', 'name')
      .sort({ createdAt: -1 })
      .exec();
  }

  async updateStatus(taskId: string, status: TaskStatus, user: UserDocument) {
    const task = await this.taskModel.findById(taskId).exec();

    if (!task) {
      throw new NotFoundException('Task not found');
    }

    // Verify user belongs to the same company
    const userCompanyId = user.companyId?.toString();
    const taskCompanyId = task.companyId?.toString();
    if (userCompanyId !== taskCompanyId) {
      throw new ForbiddenException(
        'You can only update tasks from your company',
      );
    }

    // Only assignee or manager/admin can change status
    const isAssignedUser = task.assignedTo.toString() === user._id?.toString();
    const isManagerOrAdmin =
      user.role === UserRole.MANAGER ||
      user.role === UserRole.COMPANY_ADMIN ||
      user.role === UserRole.SUPER_ADMIN;

    if (!isAssignedUser && !isManagerOrAdmin) {
      throw new ForbiddenException('You can only update tasks assigned to you');
    }

    task.status = status;
    return task.save();
  }

  async addComment(taskId: string, comment: string, user: UserDocument) {
    const task = await this.taskModel.findById(taskId).exec();

    if (!task) {
      throw new NotFoundException('Task not found');
    }

    // Verify user belongs to the same company
    const userCompanyId = user.companyId?.toString();
    const taskCompanyId = task.companyId?.toString();
    if (userCompanyId !== taskCompanyId) {
      throw new ForbiddenException(
        'You can only comment on tasks from your company',
      );
    }

    // Only assigned user or manager/admin can comment
    const isAssignedUser = task.assignedTo.toString() === user._id?.toString();
    const isManagerOrAdmin =
      user.role === UserRole.MANAGER ||
      user.role === UserRole.COMPANY_ADMIN ||
      user.role === UserRole.SUPER_ADMIN;

    if (!isAssignedUser && !isManagerOrAdmin) {
      throw new ForbiddenException(
        'You can only comment on tasks assigned to you',
      );
    }

    task.comments.push({
      userId: user._id as any,
      comment,
      createdAt: new Date(),
    });

    return task.save();
  }
}
