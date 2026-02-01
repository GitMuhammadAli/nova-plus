import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import {
  Project,
  ProjectDocument,
} from '../../project/entities/project.entity';
import { Task, TaskDocument } from '../../task/entities/task.entity';
import {
  Department,
  DepartmentDocument,
} from '../../department/entities/department.entity';

@Injectable()
export class ManagerProjectsService {
  constructor(
    @InjectModel(Project.name) private projectModel: Model<ProjectDocument>,
    @InjectModel(Task.name) private taskModel: Model<TaskDocument>,
    @InjectModel(Department.name)
    private departmentModel: Model<DepartmentDocument>,
  ) {}

  /**
   * Get all projects under manager's department
   */
  async getDepartmentProjects(
    companyId: string,
    departmentId?: string,
  ): Promise<any[]> {
    const query: any = {
      companyId: new Types.ObjectId(companyId),
      isActive: true,
    };

    // If manager has a department, filter by department
    // Note: Projects don't have departmentId yet, so we'll filter by assigned users in the department
    if (departmentId) {
      const department = await this.departmentModel
        .findById(departmentId)
        .exec();
      if (department && department.members.length > 0) {
        query.assignedUsers = { $in: department.members };
      }
    }

    const projects = await this.projectModel
      .find(query)
      .populate('createdBy', 'name email')
      .populate('assignedUsers', 'name email role')
      .sort({ createdAt: -1 })
      .lean()
      .exec();

    // Calculate progress for each project
    const projectsWithProgress = await Promise.all(
      projects.map(async (project) => {
        const tasks = await this.taskModel
          .find({
            projectId: project._id,
            isActive: true,
          })
          .exec();

        const totalTasks = tasks.length;
        const completedTasks = tasks.filter((t) => t.status === 'done').length;
        const progress =
          totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

        return {
          _id: project._id,
          name: project.name,
          description: project.description,
          status: project.status,
          progress,
          totalTasks,
          completedTasks,
          deadline: project.endDate,
          startDate: project.startDate,
          createdBy: project.createdBy,
          assignedUsers: project.assignedUsers,
          createdAt: (project as any).createdAt,
          updatedAt: (project as any).updatedAt,
        };
      }),
    );

    return projectsWithProgress;
  }

  /**
   * Get project details
   */
  async getProjectDetails(
    projectId: string,
    companyId: string,
    departmentId?: string,
  ): Promise<any> {
    const project = await this.projectModel
      .findOne({
        _id: projectId,
        companyId: new Types.ObjectId(companyId),
        isActive: true,
      })
      .populate('createdBy', 'name email')
      .populate('assignedUsers', 'name email role')
      .lean()
      .exec();

    if (!project) {
      throw new NotFoundException('Project not found');
    }

    // Verify manager has access (if departmentId provided)
    if (departmentId) {
      const department = await this.departmentModel
        .findById(departmentId)
        .exec();
      if (department) {
        const hasAccess = project.assignedUsers?.some((userId: any) =>
          department.members.some(
            (memberId) =>
              memberId.toString() === userId._id?.toString() ||
              userId.toString(),
          ),
        );
        if (!hasAccess) {
          throw new ForbiddenException(
            'You do not have access to this project',
          );
        }
      }
    }

    const tasks = await this.taskModel
      .find({
        projectId: new Types.ObjectId(projectId),
        isActive: true,
      })
      .exec();

    const totalTasks = tasks.length;
    const completedTasks = tasks.filter((t) => t.status === 'done').length;
    const progress =
      totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

    return {
      _id: project._id,
      name: project.name,
      description: project.description,
      status: project.status,
      progress,
      totalTasks,
      completedTasks,
      deadline: project.endDate,
      startDate: project.startDate,
      createdBy: project.createdBy,
      assignedUsers: project.assignedUsers,
      createdAt: (project as any).createdAt,
      updatedAt: (project as any).updatedAt,
    };
  }

  /**
   * Get all tasks for a project
   */
  async getProjectTasks(
    projectId: string,
    companyId: string,
    departmentId?: string,
  ): Promise<any[]> {
    // Verify project exists and manager has access
    await this.getProjectDetails(projectId, companyId, departmentId);

    const tasks = await this.taskModel
      .find({
        projectId: new Types.ObjectId(projectId),
        companyId: new Types.ObjectId(companyId),
        isActive: true,
      })
      .populate('assignedBy', 'name email')
      .populate('assignedTo', 'name email role')
      .sort({ createdAt: -1 })
      .lean()
      .exec();

    return tasks.map((task) => ({
      _id: task._id,
      title: task.title,
      description: task.description,
      status: task.status,
      priority: task.priority,
      assignedTo: task.assignedTo,
      assignedBy: task.assignedBy,
      dueDate: task.dueDate,
      commentsCount: task.comments?.length || 0,
      attachmentsCount: task.attachments?.length || 0,
      createdAt: (task as any).createdAt,
      updatedAt: (task as any).updatedAt,
    }));
  }
}
