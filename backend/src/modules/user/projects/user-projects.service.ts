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

@Injectable()
export class UserProjectsService {
  constructor(
    @InjectModel(Project.name) private projectModel: Model<ProjectDocument>,
    @InjectModel(Task.name) private taskModel: Model<TaskDocument>,
  ) {}

  /**
   * Get projects user is involved in
   */
  async getMyProjects(userId: string, companyId: string): Promise<any[]> {
    const projects = await this.projectModel
      .find({
        companyId: new Types.ObjectId(companyId),
        assignedUsers: new Types.ObjectId(userId),
        isActive: true,
      })
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
            assignedTo: new Types.ObjectId(userId),
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
          myTasks: totalTasks,
          myCompletedTasks: completedTasks,
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
    userId: string,
    companyId: string,
  ): Promise<any> {
    const project = await this.projectModel
      .findOne({
        _id: projectId,
        companyId: new Types.ObjectId(companyId),
        assignedUsers: new Types.ObjectId(userId),
        isActive: true,
      })
      .populate('createdBy', 'name email')
      .populate('assignedUsers', 'name email role')
      .lean()
      .exec();

    if (!project) {
      throw new NotFoundException(
        'Project not found or you are not assigned to it',
      );
    }

    // Get all tasks for this project assigned to the user
    const myTasks = await this.taskModel
      .find({
        projectId: new Types.ObjectId(projectId),
        assignedTo: new Types.ObjectId(userId),
        companyId: new Types.ObjectId(companyId),
        isActive: true,
      })
      .sort({ createdAt: -1 })
      .lean()
      .exec();

    const totalTasks = myTasks.length;
    const completedTasks = myTasks.filter((t) => t.status === 'done').length;
    const progress =
      totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

    return {
      _id: project._id,
      name: project.name,
      description: project.description,
      status: project.status,
      progress,
      myTasks: totalTasks,
      myCompletedTasks: completedTasks,
      deadline: project.endDate,
      startDate: project.startDate,
      createdBy: project.createdBy,
      assignedUsers: project.assignedUsers,
      tasks: myTasks.map((task) => ({
        _id: task._id,
        title: task.title,
        description: task.description,
        status: task.status,
        priority: task.priority,
        dueDate: task.dueDate,
        createdAt: (task as any).createdAt,
        updatedAt: (task as any).updatedAt,
      })),
      createdAt: (project as any).createdAt,
      updatedAt: (project as any).updatedAt,
    };
  }
}
