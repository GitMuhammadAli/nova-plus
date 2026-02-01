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

@Injectable()
export class UserStatsService {
  constructor(
    @InjectModel(Task.name) private taskModel: Model<TaskDocument>,
    @InjectModel(Project.name) private projectModel: Model<ProjectDocument>,
  ) {}

  /**
   * Get user stats overview
   */
  async getOverview(userId: string, companyId: string): Promise<any> {
    const tasks = await this.taskModel
      .find({
        assignedTo: new Types.ObjectId(userId),
        companyId: new Types.ObjectId(companyId),
        isActive: true,
      })
      .exec();

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

    // Get projects user is involved in
    const projects = await this.projectModel
      .countDocuments({
        companyId: new Types.ObjectId(companyId),
        assignedUsers: new Types.ObjectId(userId),
        isActive: true,
      })
      .exec();

    return {
      totalTasks,
      completedTasks,
      inProgressTasks,
      todoTasks,
      reviewTasks,
      overdueTasks,
      activeProjects: projects,
      completionRate:
        totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0,
    };
  }

  /**
   * Get user productivity stats
   */
  async getProductivity(userId: string, companyId: string): Promise<any> {
    const tasks = await this.taskModel
      .find({
        assignedTo: new Types.ObjectId(userId),
        companyId: new Types.ObjectId(companyId),
        isActive: true,
      })
      .exec();

    // Tasks by status
    const tasksByStatus = {
      todo: tasks.filter((t) => t.status === TaskStatus.TODO).length,
      in_progress: tasks.filter((t) => t.status === TaskStatus.IN_PROGRESS)
        .length,
      review: tasks.filter((t) => t.status === TaskStatus.REVIEW).length,
      done: tasks.filter((t) => t.status === TaskStatus.DONE).length,
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

    // Calculate average completion time (for completed tasks)
    const completedTasks = tasks.filter((t) => t.status === TaskStatus.DONE);
    let averageCompletionTime = 0;
    if (completedTasks.length > 0) {
      const completionTimes = completedTasks
        .filter((t) => {
          const createdAt = (t as any).createdAt;
          const updatedAt = (t as any).updatedAt;
          return createdAt && updatedAt;
        })
        .map((t) => {
          const created = new Date((t as any).createdAt);
          const updated = new Date((t as any).updatedAt);
          return (
            (updated.getTime() - created.getTime()) / (1000 * 60 * 60 * 24)
          ); // days
        });

      if (completionTimes.length > 0) {
        averageCompletionTime = Math.round(
          completionTimes.reduce((sum, time) => sum + time, 0) /
            completionTimes.length,
        );
      }
    }

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
        completed: weeklyCompleted,
        total: recentTasks.length,
      },
      averageCompletionTime, // in days
      overdueTasks,
      totalTasks: tasks.length,
      completionRate:
        tasks.length > 0
          ? Math.round((completedTasks.length / tasks.length) * 100)
          : 0,
    };
  }
}
