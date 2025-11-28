import { Injectable, Inject } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { User, UserDocument } from '../user/entities/user.entity';
import { Project, ProjectDocument } from '../project/entities/project.entity';
import { Task, TaskDocument } from '../task/entities/task.entity';
import { Invite, InviteDocument } from '../invite/entities/invite.entity';
import { AnalyticsVisit, AnalyticsVisitDocument } from './entities/analytics-visit.entity';
import { AnalyticsStatsDto, TrafficDataPoint, DeviceData, ConversionData, TopPageData } from './dto/analytics-stats.dto';

@Injectable()
export class AnalyticsService {
  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    @InjectModel(Project.name) private projectModel: Model<ProjectDocument>,
    @InjectModel(Task.name) private taskModel: Model<TaskDocument>,
    @InjectModel(Invite.name) private inviteModel: Model<InviteDocument>,
    @InjectModel(AnalyticsVisit.name) private visitModel: Model<AnalyticsVisitDocument>,
  ) {}

  /**
   * Track a page visit
   */
  async trackVisit(
    companyId: string,
    data: {
      userId?: string;
      page: string;
      referrer?: string;
      userAgent?: string;
      ipAddress?: string;
      device?: string;
      browser?: string;
      os?: string;
      duration?: number;
    },
  ): Promise<AnalyticsVisitDocument> {
    const visit = new this.visitModel({
      companyId: new Types.ObjectId(companyId),
      userId: data.userId ? new Types.ObjectId(data.userId) : undefined,
      page: data.page,
      referrer: data.referrer,
      userAgent: data.userAgent,
      ipAddress: data.ipAddress,
      device: data.device || this.detectDevice(data.userAgent),
      browser: data.browser || this.detectBrowser(data.userAgent),
      os: data.os || this.detectOS(data.userAgent),
      duration: data.duration || 0,
      visitedAt: new Date(),
    });

    return visit.save();
  }

  /**
   * Get summary statistics
   */
  async getSummary(companyId: string) {
    const now = new Date();
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const sixtyDaysAgo = new Date();
    sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);

    // Get total visitors
    const totalVisitors = await this.visitModel.distinct('userId', {
      companyId: new Types.ObjectId(companyId),
    }).then(ids => ids.filter(Boolean).length);

    // Get visitors in last 30 days
    const visitorsLast30Days = await this.visitModel.distinct('userId', {
      companyId: new Types.ObjectId(companyId),
      visitedAt: { $gte: thirtyDaysAgo },
    }).then(ids => ids.filter(Boolean).length);

    // Get visitors in previous 30 days
    const visitorsPrev30Days = await this.visitModel.distinct('userId', {
      companyId: new Types.ObjectId(companyId),
      visitedAt: { $gte: sixtyDaysAgo, $lt: thirtyDaysAgo },
    }).then(ids => ids.filter(Boolean).length);

    const visitorChange = visitorsPrev30Days > 0
      ? ((visitorsLast30Days - visitorsPrev30Days) / visitorsPrev30Days) * 100
      : (visitorsLast30Days > 0 ? 100 : 0);

    // Get total users, projects, tasks
    const totalUsers = await this.userModel.countDocuments({
      companyId: new Types.ObjectId(companyId),
    });

    const totalProjects = await this.projectModel.countDocuments({
      companyId: new Types.ObjectId(companyId),
    });

    const totalTasks = await this.taskModel.countDocuments({
      companyId: new Types.ObjectId(companyId),
    });

    // Get average session duration
    const recentVisits = await this.visitModel.find({
      companyId: new Types.ObjectId(companyId),
      visitedAt: { $gte: thirtyDaysAgo },
    }).lean();

    const totalDuration = recentVisits.reduce((sum, v) => sum + (v.duration || 0), 0);
    const avgDurationSeconds = recentVisits.length > 0 ? totalDuration / recentVisits.length : 0;
    const avgSessionDuration = this.formatDuration(avgDurationSeconds);

    // Calculate conversion rate (mock for now)
    const conversionRate = totalUsers > 0 && totalVisitors > 0 
      ? (totalUsers / Math.max(totalVisitors, totalUsers)) * 100 
      : 0;
    const conversionRateChange = 2.1; // Placeholder

    // Calculate revenue (mock for now)
    const revenue = 0; // TODO: Get from billing module
    const revenueChange = 0; // Placeholder

    return {
      totalVisitors,
      visitorsLast30Days,
      visitorChange: Math.round(visitorChange * 100) / 100,
      avgSessionDuration,
      conversionRate: Math.round(conversionRate * 100) / 100,
      conversionRateChange,
      revenue,
      revenueChange,
      totalUsers,
      totalProjects,
      totalTasks,
    };
  }

  /**
   * Get comprehensive analytics stats for a company
   */
  async getAnalyticsStats(companyId: string, period: string = '6m'): Promise<AnalyticsStatsDto> {
    const dateRange = this.getDateRange(period);
    const previousDateRange = this.getPreviousDateRange(period);

    // Get company users
    const companyUsers = await this.userModel.find({
      companyId: new Types.ObjectId(companyId),
      isActive: true,
    }).lean();

    // Get visits data
    const visits = await this.visitModel.find({
      companyId: new Types.ObjectId(companyId),
      visitedAt: { $gte: dateRange.start },
    }).lean();

    const previousVisits = await this.visitModel.find({
      companyId: new Types.ObjectId(companyId),
      visitedAt: { $gte: previousDateRange.start, $lt: previousDateRange.end },
    }).lean();

    // Calculate unique visitors
    const uniqueVisitors = new Set(visits.map(v => v.userId?.toString()).filter(Boolean));
    const totalVisitors = uniqueVisitors.size;
    const previousUniqueVisitors = new Set(previousVisits.map(v => v.userId?.toString()).filter(Boolean));
    const previousTotalVisitors = previousUniqueVisitors.size;

    // Calculate pageviews and sessions
    const pageviews = visits.length;
    const previousPageviews = previousVisits.length;
    
    // Group visits by day for traffic data
    const trafficData = this.generateTrafficData(visits, dateRange.start, period);

    // Calculate average session duration
    const totalDuration = visits.reduce((sum, v) => sum + (v.duration || 0), 0);
    const avgDurationSeconds = visits.length > 0 ? totalDuration / visits.length : 0;
    const avgSessionDuration = this.formatDuration(avgDurationSeconds);
    const previousAvgDuration = previousVisits.length > 0 
      ? previousVisits.reduce((sum, v) => sum + (v.duration || 0), 0) / previousVisits.length 
      : 0;

    // Device distribution
    const deviceData = this.calculateDeviceDistribution(visits);

    // Conversion funnel (based on user signups, active users, etc.)
    const conversionData = await this.calculateConversionFunnel(companyId, companyUsers);

    // Top pages
    const topPages = this.calculateTopPages(visits);

    // Calculate revenue (mock for now - can be replaced with billing data)
    const revenue = 0; // TODO: Get from billing module
    const previousRevenue = 0;

    // Calculate growth percentages
    const visitorsGrowth = previousTotalVisitors > 0
      ? ((totalVisitors - previousTotalVisitors) / previousTotalVisitors) * 100
      : totalVisitors > 0 ? 100 : 0;

    const sessionsGrowth = previousPageviews > 0
      ? ((pageviews - previousPageviews) / previousPageviews) * 100
      : pageviews > 0 ? 100 : 0;

    const conversionGrowth = conversionData.length > 0
      ? ((conversionData[conversionData.length - 1].rate - (conversionData[conversionData.length - 1].rate * 0.95)) / (conversionData[conversionData.length - 1].rate * 0.95)) * 100
      : 0;

    const revenueGrowth = previousRevenue > 0
      ? ((revenue - previousRevenue) / previousRevenue) * 100
      : revenue > 0 ? 100 : 0;

    return {
      totalVisitors,
      avgSessionDuration,
      conversionRate: conversionData.length > 0 ? conversionData[conversionData.length - 1].rate : 0,
      revenue,
      trafficData,
      deviceData,
      conversionData,
      topPages,
      period,
      growth: {
        visitors: Math.round(visitorsGrowth * 100) / 100,
        sessions: Math.round(sessionsGrowth * 100) / 100,
        conversion: Math.round(conversionGrowth * 100) / 100,
        revenue: Math.round(revenueGrowth * 100) / 100,
      },
    };
  }

  /**
   * Get date range based on period
   */
  private getDateRange(period: string): { start: Date; end: Date } {
    const end = new Date();
    let start = new Date();

    switch (period) {
      case '7d':
        start.setDate(end.getDate() - 7);
        break;
      case '30d':
        start.setDate(end.getDate() - 30);
        break;
      case '3m':
        start.setMonth(end.getMonth() - 3);
        break;
      case '6m':
        start.setMonth(end.getMonth() - 6);
        break;
      case '1y':
        start.setFullYear(end.getFullYear() - 1);
        break;
      default:
        start.setMonth(end.getMonth() - 6);
    }

    return { start, end };
  }

  /**
   * Get previous period date range for comparison
   */
  private getPreviousDateRange(period: string): { start: Date; end: Date } {
    const current = this.getDateRange(period);
    const duration = current.end.getTime() - current.start.getTime();
    
    return {
      start: new Date(current.start.getTime() - duration),
      end: current.start,
    };
  }

  /**
   * Generate traffic data points
   */
  private generateTrafficData(visits: any[], startDate: Date, period: string): TrafficDataPoint[] {
    const data: TrafficDataPoint[] = [];
    const days = period === '7d' ? 7 : period === '30d' ? 30 : period === '3m' ? 90 : period === '6m' ? 180 : 365;
    const interval = days <= 30 ? 1 : days <= 90 ? 7 : 30;

    for (let i = 0; i < days; i += interval) {
      const date = new Date(startDate);
      date.setDate(date.getDate() + i);
      const nextDate = new Date(date);
      nextDate.setDate(nextDate.getDate() + interval);

      const periodVisits = visits.filter(v => {
        const visitDate = new Date(v.visitedAt);
        return visitDate >= date && visitDate < nextDate;
      });

      const uniqueVisitors = new Set(periodVisits.map(v => v.userId?.toString()).filter(Boolean));

      data.push({
        date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        visitors: uniqueVisitors.size,
        pageviews: periodVisits.length,
        sessions: Math.ceil(periodVisits.length / 3), // Approximate sessions
      });
    }

    return data;
  }

  /**
   * Calculate device distribution
   */
  private calculateDeviceDistribution(visits: any[]): DeviceData[] {
    const deviceCounts: Record<string, number> = {};
    visits.forEach(visit => {
      const device = visit.device || 'unknown';
      deviceCounts[device] = (deviceCounts[device] || 0) + 1;
    });

    const total = visits.length || 1;
    const colors = {
      desktop: 'hsl(var(--primary))',
      mobile: 'hsl(var(--success))',
      tablet: 'hsl(var(--warning))',
      unknown: 'hsl(var(--muted))',
    };

    return Object.entries(deviceCounts)
      .map(([name, count]) => ({
        name: name.charAt(0).toUpperCase() + name.slice(1),
        value: Math.round((count / total) * 100),
        color: colors[name as keyof typeof colors] || colors.unknown,
      }))
      .sort((a, b) => b.value - a.value);
  }

  /**
   * Calculate conversion funnel
   */
  private async calculateConversionFunnel(companyId: string, users: any[]): Promise<ConversionData[]> {
    const totalUsers = users.length;
    const activeUsers = users.filter(u => u.isActive).length;
    
    // Get signups (users created in last period)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const recentSignups = users.filter(u => new Date(u.createdAt) >= thirtyDaysAgo).length;

    // Get projects/tasks completion as "paid" conversion
    const projects = await this.projectModel.countDocuments({
      companyId: new Types.ObjectId(companyId),
      status: 'completed',
    });

    // Use visits as base for visitors
    const visits = await this.visitModel.countDocuments({
      companyId: new Types.ObjectId(companyId),
    });
    const visitors = Math.max(visits, totalUsers * 10); // At least 10x users as visitors

    const base = Math.max(visitors, 100);

    return [
      {
        stage: 'Visitors',
        count: visitors,
        rate: 100,
      },
      {
        stage: 'Sign Ups',
        count: recentSignups,
        rate: base > 0 ? Math.round((recentSignups / base) * 100) : 0,
      },
      {
        stage: 'Active',
        count: activeUsers,
        rate: base > 0 ? Math.round((activeUsers / base) * 100) : 0,
      },
      {
        stage: 'Paid',
        count: projects,
        rate: base > 0 ? Math.round((projects / base) * 100) : 0,
      },
    ];
  }

  /**
   * Calculate top pages
   */
  private calculateTopPages(visits: any[]): TopPageData[] {
    const pageStats: Record<string, { views: number; totalDuration: number; count: number }> = {};

    visits.forEach(visit => {
      const page = visit.page || '/';
      if (!pageStats[page]) {
        pageStats[page] = { views: 0, totalDuration: 0, count: 0 };
      }
      pageStats[page].views++;
      pageStats[page].totalDuration += visit.duration || 0;
      pageStats[page].count++;
    });

    return Object.entries(pageStats)
      .map(([page, stats]) => ({
        page,
        views: stats.views,
        avgTime: this.formatDuration(stats.totalDuration / stats.count),
      }))
      .sort((a, b) => b.views - a.views)
      .slice(0, 10);
  }

  /**
   * Format duration in seconds to readable format
   */
  private formatDuration(seconds: number): string {
    if (seconds < 60) {
      return `${Math.round(seconds)}s`;
    }
    const minutes = Math.floor(seconds / 60);
    const secs = Math.round(seconds % 60);
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  }

  /**
   * Detect device from user agent
   */
  private detectDevice(userAgent?: string): string {
    if (!userAgent) return 'unknown';
    const ua = userAgent.toLowerCase();
    if (/(tablet|ipad|playbook|silk)|(android(?!.*mobi))/i.test(ua)) return 'tablet';
    if (/Mobile|Android|iP(hone|od)|IEMobile|BlackBerry|Kindle|Silk-Accelerated|(hpw|web)OS|Opera M(obi|ini)/.test(ua)) return 'mobile';
    return 'desktop';
  }

  /**
   * Detect browser from user agent
   */
  private detectBrowser(userAgent?: string): string {
    if (!userAgent) return 'unknown';
    const ua = userAgent.toLowerCase();
    if (ua.includes('chrome')) return 'Chrome';
    if (ua.includes('firefox')) return 'Firefox';
    if (ua.includes('safari')) return 'Safari';
    if (ua.includes('edge')) return 'Edge';
    if (ua.includes('opera')) return 'Opera';
    return 'Unknown';
  }

  /**
   * Detect OS from user agent
   */
  private detectOS(userAgent?: string): string {
    if (!userAgent) return 'unknown';
    const ua = userAgent.toLowerCase();
    if (ua.includes('windows')) return 'Windows';
    if (ua.includes('mac')) return 'macOS';
    if (ua.includes('linux')) return 'Linux';
    if (ua.includes('android')) return 'Android';
    if (ua.includes('ios') || ua.includes('iphone') || ua.includes('ipad')) return 'iOS';
    return 'Unknown';
  }
}
