import { Injectable, NotFoundException, ForbiddenException, BadRequestException, Inject, forwardRef } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Task, TaskDocument, TaskStatus } from '../../task/entities/task.entity';
import { Project, ProjectDocument } from '../../project/entities/project.entity';
import { AuditService } from '../../audit/audit.service';
import { AuditAction, AuditResource } from '../../audit/entities/audit-log.entity';

@Injectable()
export class UserTasksService {
  constructor(
    @InjectModel(Task.name) private taskModel: Model<TaskDocument>,
    @InjectModel(Project.name) private projectModel: Model<ProjectDocument>,
    @Inject(forwardRef(() => AuditService))
    private auditService: AuditService,
  ) {}

  /**
   * Get tasks assigned to user
   */
  async getMyTasks(
    userId: string,
    companyId: string,
    filters?: { status?: string; projectId?: string },
  ): Promise<any[]> {
    const query: any = {
      assignedTo: new Types.ObjectId(userId),
      companyId: new Types.ObjectId(companyId),
      isActive: true,
    };

    if (filters?.status) {
      query.status = filters.status;
    }

    if (filters?.projectId) {
      query.projectId = new Types.ObjectId(filters.projectId);
    }

    const tasks = await this.taskModel
      .find(query)
      .populate('assignedBy', 'name email')
      .populate('projectId', 'name')
      .sort({ createdAt: -1 })
      .lean()
      .exec();

    return tasks.map(task => ({
      _id: task._id,
      title: task.title,
      description: task.description,
      status: task.status,
      priority: task.priority,
      assignedBy: task.assignedBy,
      project: task.projectId,
      dueDate: task.dueDate,
      commentsCount: task.comments?.length || 0,
      attachmentsCount: task.attachments?.length || 0,
      createdAt: (task as any).createdAt,
      updatedAt: (task as any).updatedAt,
    }));
  }

  /**
   * Get task details (user can only view their own tasks)
   */
  async getTaskDetails(taskId: string, userId: string, companyId: string): Promise<any> {
    const task = await this.taskModel
      .findOne({
        _id: taskId,
        assignedTo: new Types.ObjectId(userId),
        companyId: new Types.ObjectId(companyId),
        isActive: true,
      })
      .populate('assignedBy', 'name email')
      .populate('projectId', 'name description')
      .populate('comments.userId', 'name email')
      .populate('attachments.uploadedBy', 'name email')
      .lean()
      .exec();

    if (!task) {
      throw new NotFoundException('Task not found or you do not have access');
    }

    return task;
  }

  /**
   * Update task status (user can only update their own tasks)
   * Allowed transitions: todo → in_progress → review → done
   */
  async updateTaskStatus(
    taskId: string,
    status: string,
    userId: string,
    companyId: string,
  ): Promise<TaskDocument> {
    const task = await this.taskModel.findOne({
      _id: taskId,
      assignedTo: new Types.ObjectId(userId),
      companyId: new Types.ObjectId(companyId),
      isActive: true,
    }).exec();

    if (!task) {
      throw new NotFoundException('Task not found or you do not have access');
    }

    // Validate status transition
    const allowedTransitions: Record<string, string[]> = {
      todo: ['in_progress'],
      in_progress: ['review'],
      review: ['done'],
    };

    const currentStatus = task.status;
    if (allowedTransitions[currentStatus] && !allowedTransitions[currentStatus].includes(status)) {
      throw new BadRequestException(
        `Invalid status transition. From ${currentStatus}, you can only move to: ${allowedTransitions[currentStatus].join(', ')}`
      );
    }

    const oldStatus = task.status;
    task.status = status as TaskStatus;
    const saved = await task.save();

    // Audit log
    try {
      await this.auditService.createLog({
        action: AuditAction.UPDATE,
        resource: AuditResource.TASK,
        userId: userId,
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
  ): Promise<TaskDocument> {
    const task = await this.taskModel.findOne({
      _id: taskId,
      assignedTo: new Types.ObjectId(userId),
      companyId: new Types.ObjectId(companyId),
      isActive: true,
    }).exec();

    if (!task) {
      throw new NotFoundException('Task not found or you do not have access');
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
    attachment: { filename: string; url: string; size?: number; mimeType?: string },
    companyId: string,
  ): Promise<TaskDocument> {
    const task = await this.taskModel.findOne({
      _id: taskId,
      assignedTo: new Types.ObjectId(userId),
      companyId: new Types.ObjectId(companyId),
      isActive: true,
    }).exec();

    if (!task) {
      throw new NotFoundException('Task not found or you do not have access');
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

