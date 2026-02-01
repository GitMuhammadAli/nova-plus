import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User, UserDocument } from '../user/entities/user.entity';
import { Task, TaskDocument } from '../task/entities/task.entity';
import {
  Activity,
  ActivityDocument,
  ActivityType,
} from './entities/activity.entity';
import { DashboardSummaryDto } from './dto/dashboard-summary.dto';
import { DashboardStatsDto, StatPoint } from './dto/dashboard-stats.dto';
import { RecentActivityDto } from './dto/recent-activity.dto';

@Injectable()
export class DashboardService {
  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    @InjectModel(Task.name) private taskModel: Model<TaskDocument>,
    @InjectModel(Activity.name) private activityModel: Model<ActivityDocument>,
  ) {}

  async getSummary(): Promise<DashboardSummaryDto> {
    const now = new Date();
    const last30Days = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const previous30Days = new Date(
      last30Days.getTime() - 30 * 24 * 60 * 60 * 1000,
    );

    // Get user stats
    const totalUsers = await this.userModel.countDocuments({});
    // Count users who were active in the last 30 days (using createdAt as proxy for now)
    // In production, you'd want to track lastLogin or use a separate activity log
    const activeUsers = await this.userModel.countDocuments({
      createdAt: { $gte: last30Days },
    });
    const previousPeriodUsers = await this.userModel.countDocuments({
      createdAt: { $lt: last30Days, $gte: previous30Days },
    });
    const currentPeriodUsers = await this.userModel.countDocuments({
      createdAt: { $gte: last30Days },
    });
    const userGrowth =
      previousPeriodUsers > 0
        ? ((currentPeriodUsers - previousPeriodUsers) / previousPeriodUsers) *
          100
        : currentPeriodUsers > 0
          ? 100
          : 0;

    // Get activity stats
    const totalActivities = await this.activityModel.countDocuments({});
    const previousPeriodActivities = await this.activityModel.countDocuments({
      createdAt: { $lt: last30Days, $gte: previous30Days },
    });
    const currentPeriodActivities = await this.activityModel.countDocuments({
      createdAt: { $gte: last30Days },
    });
    const activityGrowth =
      previousPeriodActivities > 0
        ? ((currentPeriodActivities - previousPeriodActivities) /
            previousPeriodActivities) *
          100
        : currentPeriodActivities > 0
          ? 100
          : 0;

    // Calculate revenue (mock for now - can be replaced with actual billing data)
    const revenueTotal = 0; // TODO: Replace with actual revenue calculation from billing module
    const revenueGrowth = 0; // TODO: Calculate from billing data

    // Calculate overall growth percentage
    const overallGrowth = (userGrowth + activityGrowth) / 2;

    return {
      revenue: {
        total: revenueTotal,
        growth: revenueGrowth,
        period: '30d',
      },
      users: {
        total: totalUsers,
        active: activeUsers,
        growth: Math.round(userGrowth * 100) / 100,
        period: '30d',
      },
      activity: {
        total: totalActivities,
        growth: Math.round(activityGrowth * 100) / 100,
        period: '30d',
      },
      growth: {
        percentage: Math.round(overallGrowth * 100) / 100,
        period: '30d',
      },
    };
  }

  async getStats(period: string = '30d'): Promise<DashboardStatsDto> {
    const now = new Date();
    let days: number;

    switch (period) {
      case '7d':
        days = 7;
        break;
      case '30d':
        days = 30;
        break;
      case '90d':
        days = 90;
        break;
      case '1y':
        days = 365;
        break;
      default:
        days = 30;
    }

    const startDate = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);

    // User growth over time
    const userGrowth = await this.getUserGrowthStats(startDate, days);

    // Activity trend over time
    const activityTrend = await this.getActivityTrendStats(startDate, days);

    // Task completion trend
    const taskCompletion = await this.getTaskCompletionStats(startDate, days);

    return {
      userGrowth,
      activityTrend,
      taskCompletion,
    };
  }

  private async getUserGrowthStats(
    startDate: Date,
    days: number,
  ): Promise<StatPoint[]> {
    const points: StatPoint[] = [];
    const interval = days <= 7 ? 1 : days <= 30 ? 1 : days <= 90 ? 7 : 30;

    for (let i = 0; i < days; i += interval) {
      const date = new Date(startDate);
      date.setDate(date.getDate() + i);
      const nextDate = new Date(date);
      nextDate.setDate(nextDate.getDate() + interval);

      const count = await this.userModel.countDocuments({
        createdAt: { $gte: date, $lt: nextDate },
      });

      points.push({
        date: date.toISOString().split('T')[0],
        value: count,
        label: date.toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
        }),
      });
    }

    return points;
  }

  private async getActivityTrendStats(
    startDate: Date,
    days: number,
  ): Promise<StatPoint[]> {
    const points: StatPoint[] = [];
    const interval = days <= 7 ? 1 : days <= 30 ? 1 : days <= 90 ? 7 : 30;

    for (let i = 0; i < days; i += interval) {
      const date = new Date(startDate);
      date.setDate(date.getDate() + i);
      const nextDate = new Date(date);
      nextDate.setDate(nextDate.getDate() + interval);

      const count = await this.activityModel.countDocuments({
        createdAt: { $gte: date, $lt: nextDate },
      });

      points.push({
        date: date.toISOString().split('T')[0],
        value: count,
        label: date.toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
        }),
      });
    }

    return points;
  }

  private async getTaskCompletionStats(
    startDate: Date,
    days: number,
  ): Promise<StatPoint[]> {
    const points: StatPoint[] = [];
    const interval = days <= 7 ? 1 : days <= 30 ? 1 : days <= 90 ? 7 : 30;

    for (let i = 0; i < days; i += interval) {
      const date = new Date(startDate);
      date.setDate(date.getDate() + i);
      const nextDate = new Date(date);
      nextDate.setDate(nextDate.getDate() + interval);

      const count = await this.taskModel.countDocuments({
        status: 'DONE',
        updatedAt: { $gte: date, $lt: nextDate },
      });

      points.push({
        date: date.toISOString().split('T')[0],
        value: count,
        label: date.toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
        }),
      });
    }

    return points;
  }

  async getRecentActivities(limit: number = 10): Promise<RecentActivityDto[]> {
    const activities = await this.activityModel
      .find()
      .sort({ createdAt: -1 })
      .limit(limit)
      .populate('userId', 'name email')
      .exec();

    return activities.map((activity) => ({
      id: String(activity._id),
      type: activity.type,
      user: activity.userId
        ? {
            id: String((activity.userId as any)._id),
            name:
              (activity.userId as any).name || activity.userName || 'Unknown',
            email: (activity.userId as any).email || 'unknown@example.com',
          }
        : undefined,
      action: activity.action,
      description: activity.description,
      target: activity.target,
      timestamp: activity.createdAt
        ? activity.createdAt.toISOString()
        : new Date().toISOString(),
      icon: this.getActivityIcon(activity.type),
    }));
  }

  private getActivityIcon(type: ActivityType): string {
    const iconMap: Record<ActivityType, string> = {
      [ActivityType.USER_CREATED]: 'UserPlus',
      [ActivityType.USER_UPDATED]: 'User',
      [ActivityType.USER_DELETED]: 'UserMinus',
      [ActivityType.TASK_CREATED]: 'Plus',
      [ActivityType.TASK_UPDATED]: 'Edit',
      [ActivityType.TASK_COMPLETED]: 'CheckCircle',
      [ActivityType.AUTOMATION_TRIGGERED]: 'Zap',
      [ActivityType.AUTOMATION_UPDATED]: 'Settings',
      [ActivityType.SETTINGS_UPDATED]: 'Settings',
      [ActivityType.REPORT_GENERATED]: 'FileText',
      [ActivityType.FILE_UPLOADED]: 'Upload',
      [ActivityType.FILE_DELETED]: 'Trash',
      [ActivityType.LOGIN]: 'LogIn',
      [ActivityType.LOGOUT]: 'LogOut',
      [ActivityType.SYSTEM]: 'Server',
    };
    return iconMap[type] || 'Activity';
  }

  /**
   * Helper method to log an activity - can be used by other modules
   */
  async logActivity(
    type: ActivityType,
    action: string,
    userId?: string,
    userName?: string,
    description?: string,
    target?: string,
    metadata?: Record<string, any>,
  ): Promise<Activity> {
    const activity = new this.activityModel({
      type,
      action,
      userId: userId || undefined,
      userName,
      description,
      target,
      metadata,
    });
    return activity.save();
  }
}
