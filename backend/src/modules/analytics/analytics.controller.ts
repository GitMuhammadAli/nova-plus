import {
  Controller,
  Get,
  Post,
  Body,
  Query,
  UseGuards,
  Req,
} from '@nestjs/common';
import { AnalyticsService } from './analytics.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '../user/entities/user.entity';

@Controller('analytics')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  /**
   * Track a page visit (alias for /track)
   */
  @Post('visit')
  @Roles(
    UserRole.COMPANY_ADMIN,
    UserRole.MANAGER,
    UserRole.USER,
    UserRole.SUPER_ADMIN,
  )
  async recordVisit(
    @Req() req,
    @Body() body: { path: string; metadata?: Record<string, any> },
  ) {
    const user = req.user;
    const companyId = user.companyId?.toString() || user.companyId;
    const userAgent = req.headers['user-agent'] || '';

    return this.analyticsService.trackVisit(companyId, {
      userId: user._id?.toString() || user.id,
      page: body.path,
      referrer: body.metadata?.referrer,
      userAgent: body.metadata?.userAgent || userAgent,
      ipAddress: req.ip,
      device: body.metadata?.deviceType,
      browser: body.metadata?.browser,
      os: body.metadata?.os,
      duration: body.metadata?.duration,
    });
  }

  /**
   * Track a page visit
   */
  @Post('track')
  @Roles(
    UserRole.COMPANY_ADMIN,
    UserRole.MANAGER,
    UserRole.USER,
    UserRole.SUPER_ADMIN,
  )
  async trackVisit(
    @Req() req,
    @Body()
    body: {
      page: string;
      referrer?: string;
      userAgent?: string;
      ipAddress?: string;
      device?: string;
      browser?: string;
      os?: string;
      duration?: number;
    },
  ) {
    const user = req.user;
    const companyId = user.companyId?.toString() || user.companyId;

    return this.analyticsService.trackVisit(companyId, {
      userId: user._id?.toString() || user.id,
      page: body.page,
      referrer: body.referrer,
      userAgent: body.userAgent || req.headers['user-agent'],
      ipAddress: body.ipAddress || req.ip,
      device: body.device,
      browser: body.browser,
      os: body.os,
      duration: body.duration,
    });
  }

  /**
   * Get summary statistics
   */
  @Get('summary')
  @Roles(UserRole.COMPANY_ADMIN, UserRole.MANAGER, UserRole.SUPER_ADMIN)
  async getSummary(@Req() req) {
    const user = req.user;
    const companyId = user.companyId?.toString() || user.companyId;
    return this.analyticsService.getSummary(companyId);
  }

  /**
   * Get comprehensive analytics stats
   */
  @Get('stats')
  @Roles(UserRole.COMPANY_ADMIN, UserRole.MANAGER, UserRole.SUPER_ADMIN)
  async getStats(@Req() req, @Query('period') period?: string) {
    const user = req.user;
    const companyId = user.companyId?.toString() || user.companyId;

    return this.analyticsService.getAnalyticsStats(companyId, period || '6m');
  }

  /**
   * Get traffic data
   */
  @Get('traffic')
  @Roles(UserRole.COMPANY_ADMIN, UserRole.MANAGER, UserRole.SUPER_ADMIN)
  async getTraffic(@Req() req, @Query('period') period?: string) {
    const user = req.user;
    const companyId = user.companyId?.toString() || user.companyId;
    const stats = await this.analyticsService.getAnalyticsStats(
      companyId,
      period || '6m',
    );

    return {
      success: true,
      data: {
        trafficData: stats.trafficData,
        totalVisitors: stats.totalVisitors,
        growth: stats.growth.visitors,
      },
    };
  }

  /**
   * Get device distribution
   */
  @Get('devices')
  @Roles(UserRole.COMPANY_ADMIN, UserRole.MANAGER, UserRole.SUPER_ADMIN)
  async getDevices(@Req() req, @Query('period') period?: string) {
    const user = req.user;
    const companyId = user.companyId?.toString() || user.companyId;
    const stats = await this.analyticsService.getAnalyticsStats(
      companyId,
      period || '6m',
    );

    return {
      success: true,
      data: stats.deviceData,
    };
  }

  /**
   * Get conversion funnel
   */
  @Get('conversion')
  @Roles(UserRole.COMPANY_ADMIN, UserRole.MANAGER, UserRole.SUPER_ADMIN)
  async getConversion(@Req() req, @Query('period') period?: string) {
    const user = req.user;
    const companyId = user.companyId?.toString() || user.companyId;
    const stats = await this.analyticsService.getAnalyticsStats(
      companyId,
      period || '6m',
    );

    return {
      success: true,
      data: stats.conversionData,
    };
  }

  /**
   * Get top pages
   */
  @Get('top-pages')
  @Roles(UserRole.COMPANY_ADMIN, UserRole.MANAGER, UserRole.SUPER_ADMIN)
  async getTopPages(@Req() req, @Query('period') period?: string) {
    const user = req.user;
    const companyId = user.companyId?.toString() || user.companyId;
    const stats = await this.analyticsService.getAnalyticsStats(
      companyId,
      period || '6m',
    );

    return {
      success: true,
      data: stats.topPages,
    };
  }
}
