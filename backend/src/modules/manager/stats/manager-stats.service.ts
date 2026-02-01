import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import {
  Task,
  TaskDocument,
  TaskStatus,
} from '../../task/entities/task.entity';
import {
  Project,
  ProjectDocument,
} from '../../project/entities/project.entity';
import { User, UserDocument } from '../../user/entities/user.entity';
import {
  Department,
  DepartmentDocument,
} from '../../department/entities/department.entity';

@Injectable()
export class ManagerStatsService {
  constructor(
    @InjectModel(Task.name) private taskModel: Model<TaskDocument>,
    @InjectModel(Project.name) private projectModel: Model<ProjectDocument>,
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    @InjectModel(Department.name)
    private departmentModel: Model<DepartmentDocument>,
  ) {}

  /**
   * Get overview statistics
   */
  async getOverview(companyId: string, departmentId?: string): Promise<any> {
    const taskQuery: any = {
      companyId: new Types.ObjectId(companyId),
      isActive: true,
    };

    if (departmentId) {
      taskQuery.departmentId = new Types.ObjectId(departmentId);
    }

    const tasks = await this.taskModel.find(taskQuery).exec();
    const totalTasks = tasks.length;
    const completedTasks = tasks.filter(
      (t) => t.status === TaskStatus.DONE,
    ).length;
    const inProgressTasks = tasks.filter(
      (t) => t.status === TaskStatus.IN_PROGRESS,
    ).length;
    const todoTasks = tasks.filter((t) => t.status === TaskStatus.TODO).length;
    const reviewTasks = tasks.filter(
      (t) => t.status === TaskStatus.REVIEW,
    ).length;

    const now = new Date();
    const overdueTasks = tasks.filter(
      (t) =>
        t.dueDate && new Date(t.dueDate) < now && t.status !== TaskStatus.DONE,
    ).length;

    // Get team size
    let teamSize = 0;
    if (departmentId) {
      const department = await this.departmentModel
        .findById(departmentId)
        .exec();
      if (department) {
        teamSize = department.members.length;
      }
    }

    // Get active projects
    const projectQuery: any = {
      companyId: new Types.ObjectId(companyId),
      isActive: true,
      status: 'active',
    };

    if (departmentId) {
      const department = await this.departmentModel
        .findById(departmentId)
        .exec();
      if (department && department.members.length > 0) {
        projectQuery.assignedUsers = { $in: department.members };
      }
    }

    const activeProjects = await this.projectModel
      .countDocuments(projectQuery)
      .exec();

    return {
      totalTasks,
      completedTasks,
      inProgressTasks,
      todoTasks,
      reviewTasks,
      overdueTasks,
      teamSize,
      activeProjects,
      completionRate:
        totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0,
    };
  }

  /**
   * Get detailed task statistics
   */
  async getTaskStats(companyId: string, departmentId?: string): Promise<any> {
    const query: any = {
      companyId: new Types.ObjectId(companyId),
      isActive: true,
    };

    if (departmentId) {
      query.departmentId = new Types.ObjectId(departmentId);
    }

    const tasks = await this.taskModel.find(query).exec();

    // Tasks by status
    const tasksByStatus = {
      todo: tasks.filter((t) => t.status === TaskStatus.TODO).length,
      in_progress: tasks.filter((t) => t.status === TaskStatus.IN_PROGRESS)
        .length,
      review: tasks.filter((t) => t.status === TaskStatus.REVIEW).length,
      done: tasks.filter((t) => t.status === TaskStatus.DONE).length,
      cancelled: tasks.filter((t) => t.status === TaskStatus.CANCELLED).length,
    };

    // Tasks by priority
    const tasksByPriority = {
      low: tasks.filter((t) => t.priority === 'low').length,
      medium: tasks.filter((t) => t.priority === 'medium').length,
      high: tasks.filter((t) => t.priority === 'high').length,
    };

    // Weekly summary (last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const recentTasks = tasks.filter((t) => {
      const createdAt = (t as any).createdAt;
      return createdAt && new Date(createdAt) >= sevenDaysAgo;
    });

    const weeklyCompleted = recentTasks.filter(
      (t) => t.status === TaskStatus.DONE,
    ).length;
    const weeklyCreated = recentTasks.length;

    // Overdue tasks
    const now = new Date();
    const overdueTasks = tasks.filter(
      (t) =>
        t.dueDate && new Date(t.dueDate) < now && t.status !== TaskStatus.DONE,
    ).length;

    return {
      tasksByStatus,
      tasksByPriority,
      weeklySummary: {
        created: weeklyCreated,
        completed: weeklyCompleted,
      },
      overdueTasks,
      totalTasks: tasks.length,
    };
  }

  /**
   * Get team productivity statistics
   */
  async getTeamStats(companyId: string, departmentId?: string): Promise<any> {
    let userIds: Types.ObjectId[] = [];

    if (departmentId) {
      const department = await this.departmentModel
        .findById(departmentId)
        .exec();
      if (department) {
        userIds = department.members;
      }
    }

    if (userIds.length === 0) {
      return {
        teamProductivity: [],
        averageCompletionRate: 0,
        totalTeamTasks: 0,
      };
    }

    const users = await this.userModel
      .find({
        _id: { $in: userIds },
        companyId: new Types.ObjectId(companyId),
        isActive: true,
      })
      .select('name email')
      .lean()
      .exec();

    const teamProductivity = await Promise.all(
      users.map(async (user) => {
        const tasks = await this.taskModel
          .find({
            assignedTo: user._id,
            companyId: new Types.ObjectId(companyId),
            isActive: true,
          })
          .exec();

        const total = tasks.length;
        const completed = tasks.filter(
          (t) => t.status === TaskStatus.DONE,
        ).length;
        const completionRate =
          total > 0 ? Math.round((completed / total) * 100) : 0;

        return {
          userId: user._id,
          name: user.name,
          email: user.email,
          totalTasks: total,
          completedTasks: completed,
          completionRate,
        };
      }),
    );

    const totalTeamTasks = teamProductivity.reduce(
      (sum, member) => sum + member.totalTasks,
      0,
    );
    const totalCompleted = teamProductivity.reduce(
      (sum, member) => sum + member.completedTasks,
      0,
    );
    const averageCompletionRate =
      teamProductivity.length > 0
        ? Math.round(
            teamProductivity.reduce(
              (sum, member) => sum + member.completionRate,
              0,
            ) / teamProductivity.length,
          )
        : 0;

    return {
      teamProductivity,
      averageCompletionRate,
      totalTeamTasks,
      totalCompleted,
      teamSize: teamProductivity.length,
    };
  }
}
