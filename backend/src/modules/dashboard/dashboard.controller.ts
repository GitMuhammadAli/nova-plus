import { Controller, Get, Query, UseGuards, Request } from '@nestjs/common';
import { DashboardService } from './dashboard.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { DashboardSummaryDto } from './dto/dashboard-summary.dto';
import { DashboardStatsDto } from './dto/dashboard-stats.dto';
import { RecentActivityDto } from './dto/recent-activity.dto';

@Controller('dashboard')
@UseGuards(JwtAuthGuard)
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('summary')
  async getSummary(@Request() req): Promise<DashboardSummaryDto> {
    return this.dashboardService.getSummary();
  }

  @Get('stats')
  async getStats(@Query('period') period?: string): Promise<DashboardStatsDto> {
    return this.dashboardService.getStats(period);
  }
}

@Controller('activity')
@UseGuards(JwtAuthGuard)
export class ActivityController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('recent')
  async getRecentActivities(
    @Query('limit') limit?: string,
  ): Promise<RecentActivityDto[]> {
    const limitNum = limit ? parseInt(limit, 10) : 10;
    return this.dashboardService.getRecentActivities(limitNum);
  }
}
