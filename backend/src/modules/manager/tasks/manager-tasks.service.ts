import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
  Inject,
  forwardRef,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import {
  Task,
  TaskDocument,
  TaskStatus,
} from '../../task/entities/task.entity';
import { User, UserDocument } from '../../user/entities/user.entity';
import { CreateTaskDto } from '../../task/dto/create-task.dto';
import { UpdateTaskDto } from '../../task/dto/update-task.dto';
import { ManagerService } from '../manager.service';
import { AuditService } from '../../audit/audit.service';
import {
  AuditAction,
  AuditResource,
} from '../../audit/entities/audit-log.entity';

@Injectable()
export class ManagerTasksService {
  constructor(
    @InjectModel(Task.name) private taskModel: Model<TaskDocument>,
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    @Inject(forwardRef(() => ManagerService))
    private managerService: ManagerService,
    @Inject(forwardRef(() => AuditService))
    private auditService: AuditService,
  ) {}

  /**
   * Create a new task
   */
  async createTask(
    createTaskDto: CreateTaskDto,
    manager: any,
    companyId: string,
    departmentId?: string,
  ): Promise<TaskDocument> {
    // Verify assigned user belongs to manager's department
    if (createTaskDto.assignedTo && departmentId) {
      const userInDepartment = await this.managerService.verifyUserInDepartment(
        createTaskDto.assignedTo,
        departmentId,
        companyId,
      );
      if (!userInDepartment) {
        throw new ForbiddenException(
          'Cannot assign tasks to users outside your department',
        );
      }
    }

    const task = new this.taskModel({
      ...createTaskDto,
      companyId: new Types.ObjectId(companyId),
      departmentId: departmentId ? new Types.ObjectId(departmentId) : undefined,
      assignedBy: new Types.ObjectId(manager._id || manager.id),
      assignedTo: createTaskDto.assignedTo
        ? new Types.ObjectId(createTaskDto.assignedTo)
        : undefined,
      projectId: createTaskDto.projectId
        ? new Types.ObjectId(createTaskDto.projectId)
        : undefined,
      status: createTaskDto.status || TaskStatus.TODO,
      isActive: true,
    });

    const saved = await task.save();

    // Audit log
    try {
      await this.auditService.createLog({
        action: AuditAction.CREATE,
        resource: AuditResource.TASK,
        userId: manager._id || manager.id,
        companyId: companyId,
        resourceId: (saved._id?.toString() || saved._id) as
          | string
          | Types.ObjectId,
        metadata: {
          title: saved.title,
          assignedTo: saved.assignedTo?.toString(),
        },
      });
    } catch (error) {
      console.error('Failed to create audit log:', error);
    }

    return saved;
  }

  /**
   * Get tasks for manager's department
   */
  async getTasks(
    companyId: string,
    departmentId: string | undefined,
    filters?: { projectId?: string; status?: string; assignedTo?: string },
  ): Promise<any[]> {
    const query: any = {
      companyId: new Types.ObjectId(companyId),
      isActive: true,
    };

    if (departmentId) {
      query.departmentId = new Types.ObjectId(departmentId);
    }

    if (filters?.projectId) {
      query.projectId = new Types.ObjectId(filters.projectId);
    }

    if (filters?.status) {
      query.status = filters.status;
    }

    if (filters?.assignedTo) {
      query.assignedTo = new Types.ObjectId(filters.assignedTo);
    }

    const tasks = await this.taskModel
      .find(query)
      .populate('assignedBy', 'name email')
      .populate('assignedTo', 'name email role')
      .populate('projectId', 'name')
      .sort({ createdAt: -1 })
      .lean()
      .exec();

    return tasks;
  }

  /**
   * Get task details
   */
  async getTaskDetails(
    taskId: string,
    companyId: string,
    departmentId?: string,
  ): Promise<any> {
    const task = await this.taskModel
      .findOne({
        _id: taskId,
        companyId: new Types.ObjectId(companyId),
        isActive: true,
      })
      .populate('assignedBy', 'name email')
      .populate('assignedTo', 'name email role')
      .populate('projectId', 'name description')
      .populate('comments.userId', 'name email')
      .populate('attachments.uploadedBy', 'name email')
      .lean()
      .exec();

    if (!task) {
      throw new NotFoundException('Task not found');
    }

    // Verify manager has access
    if (departmentId && task.departmentId) {
      if (task.departmentId.toString() !== departmentId) {
        throw new ForbiddenException('You do not have access to this task');
      }
    }

    return task;
  }

  /**
   * Update task
   */
  async updateTask(
    taskId: string,
    updateTaskDto: UpdateTaskDto,
    companyId: string,
    departmentId: string | undefined,
    manager: any,
  ): Promise<TaskDocument> {
    const task = await this.taskModel
      .findOne({
        _id: taskId,
        companyId: new Types.ObjectId(companyId),
        isActive: true,
      })
      .exec();

    if (!task) {
      throw new NotFoundException('Task not found');
    }

    // Verify manager has access
    if (departmentId && task.departmentId) {
      if (task.departmentId.toString() !== departmentId) {
        throw new ForbiddenException('You do not have access to this task');
      }
    }

    // If reassigning, verify user is in department
    if (updateTaskDto.assignedTo && departmentId) {
      const userInDepartment = await this.managerService.verifyUserInDepartment(
        updateTaskDto.assignedTo,
        departmentId,
        companyId,
      );
      if (!userInDepartment) {
        throw new ForbiddenException(
          'Cannot assign tasks to users outside your department',
        );
      }
    }

    Object.assign(task, updateTaskDto);
    if (updateTaskDto.assignedTo) {
      task.assignedTo = new Types.ObjectId(updateTaskDto.assignedTo);
    }
    if (updateTaskDto.projectId) {
      task.projectId = new Types.ObjectId(updateTaskDto.projectId);
    }

    const saved = await task.save();

    // Audit log
    try {
      await this.auditService.createLog({
        action: AuditAction.UPDATE,
        resource: AuditResource.TASK,
        userId: manager._id || manager.id,
        companyId: companyId,
        resourceId: (saved._id?.toString() || saved._id) as
          | string
          | Types.ObjectId,
        metadata: { changes: updateTaskDto },
      });
    } catch (error) {
      console.error('Failed to create audit log:', error);
    }

    return saved;
  }

  /**
   * Delete task
   */
  async deleteTask(
    taskId: string,
    companyId: string,
    departmentId: string | undefined,
    manager: any,
  ): Promise<void> {
    const task = await this.taskModel
      .findOne({
        _id: taskId,
        companyId: new Types.ObjectId(companyId),
        isActive: true,
      })
      .exec();

    if (!task) {
      throw new NotFoundException('Task not found');
    }

    // Verify manager has access
    if (departmentId && task.departmentId) {
      if (task.departmentId.toString() !== departmentId) {
        throw new ForbiddenException('You do not have access to this task');
      }
    }

    task.isActive = false;
    await task.save();

    // Audit log
    try {
      await this.auditService.createLog({
        action: AuditAction.DELETE,
        resource: AuditResource.TASK,
        userId: manager._id || manager.id,
        companyId: companyId,
        resourceId: taskId,
        metadata: { title: task.title },
      });
    } catch (error) {
      console.error('Failed to create audit log:', error);
    }
  }

  /**
   * Assign task to user
   */
  async assignTask(
    taskId: string,
    userId: string,
    companyId: string,
    departmentId: string | undefined,
    manager: any,
  ): Promise<TaskDocument> {
    // Verify user is in department
    if (departmentId) {
      const userInDepartment = await this.managerService.verifyUserInDepartment(
        userId,
        departmentId,
        companyId,
      );
      if (!userInDepartment) {
        throw new ForbiddenException(
          'Cannot assign tasks to users outside your department',
        );
      }
    }

    const task = await this.taskModel
      .findOne({
        _id: taskId,
        companyId: new Types.ObjectId(companyId),
        isActive: true,
      })
      .exec();

    if (!task) {
      throw new NotFoundException('Task not found');
    }

    task.assignedTo = new Types.ObjectId(userId);
    const saved = await task.save();

    // Audit log
    try {
      await this.auditService.createLog({
        action: AuditAction.USER_ASSIGNED,
        resource: AuditResource.TASK,
        userId: manager._id || manager.id,
        companyId: companyId,
        resourceId: taskId,
        metadata: { assignedTo: userId },
      });
    } catch (error) {
      console.error('Failed to create audit log:', error);
    }

    return saved;
  }

  /**
   * Update task status
   */
  async updateTaskStatus(
    taskId: string,
    status: string,
    companyId: string,
    departmentId: string | undefined,
    manager: any,
  ): Promise<TaskDocument> {
    const task = await this.taskModel
      .findOne({
        _id: taskId,
        companyId: new Types.ObjectId(companyId),
        isActive: true,
      })
      .exec();

    if (!task) {
      throw new NotFoundException('Task not found');
    }

    // Verify manager has access
    if (departmentId && task.departmentId) {
      if (task.departmentId.toString() !== departmentId) {
        throw new ForbiddenException('You do not have access to this task');
      }
    }

    const oldStatus = task.status;
    task.status = status as TaskStatus;
    const saved = await task.save();

    // Audit log
    try {
      await this.auditService.createLog({
        action: AuditAction.UPDATE,
        resource: AuditResource.TASK,
        userId: manager._id || manager.id,
        companyId: companyId,
        resourceId: taskId,
        metadata: { statusChange: { from: oldStatus, to: status } },
      });
    } catch (error) {
      console.error('Failed to create audit log:', error);
    }

    return saved;
  }

  /**
   * Add comment to task
   */
  async addComment(
    taskId: string,
    userId: string,
    comment: string,
    companyId: string,
    departmentId: string | undefined,
  ): Promise<TaskDocument> {
    const task = await this.taskModel
      .findOne({
        _id: taskId,
        companyId: new Types.ObjectId(companyId),
        isActive: true,
      })
      .exec();

    if (!task) {
      throw new NotFoundException('Task not found');
    }

    // Verify manager has access
    if (departmentId && task.departmentId) {
      if (task.departmentId.toString() !== departmentId) {
        throw new ForbiddenException('You do not have access to this task');
      }
    }

    if (!task.comments) {
      task.comments = [];
    }

    task.comments.push({
      userId: new Types.ObjectId(userId),
      comment,
      createdAt: new Date(),
    });

    return task.save();
  }

  /**
   * Add attachment to task
   */
  async addAttachment(
    taskId: string,
    userId: string,
    attachment: {
      filename: string;
      url: string;
      size?: number;
      mimeType?: string;
    },
    companyId: string,
    departmentId: string | undefined,
  ): Promise<TaskDocument> {
    const task = await this.taskModel
      .findOne({
        _id: taskId,
        companyId: new Types.ObjectId(companyId),
        isActive: true,
      })
      .exec();

    if (!task) {
      throw new NotFoundException('Task not found');
    }

    // Verify manager has access
    if (departmentId && task.departmentId) {
      if (task.departmentId.toString() !== departmentId) {
        throw new ForbiddenException('You do not have access to this task');
      }
    }

    if (!task.attachments) {
      task.attachments = [];
    }

    task.attachments.push({
      filename: attachment.filename,
      url: attachment.url,
      uploadedBy: new Types.ObjectId(userId),
      uploadedAt: new Date(),
      size: attachment.size,
      mimeType: attachment.mimeType,
    });

    return task.save();
  }
}
