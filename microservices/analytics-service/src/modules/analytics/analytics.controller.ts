import { Controller, Get, Query, Param } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { AnalyticsService } from './analytics.service';
import { StatsService } from './stats.service';

@ApiTags('Analytics')
@Controller()
export class AnalyticsController {
  constructor(
    private readonly analyticsService: AnalyticsService,
    private readonly statsService: StatsService,
  ) {}

  @Get('company/:companyId/stats')
  @ApiOperation({ summary: 'Get company statistics' })
  async getCompanyStats(@Param('companyId') companyId: string) {
    return this.statsService.getCompanyStats(companyId);
  }

  @Get('company/:companyId/users')
  @ApiOperation({ summary: 'Get user engagement analytics' })
  @ApiQuery({ name: 'startDate', required: false })
  @ApiQuery({ name: 'endDate', required: false })
  async getUserAnalytics(
    @Param('companyId') companyId: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.analyticsService.getUserEngagement(companyId, startDate, endDate);
  }

  @Get('company/:companyId/departments')
  @ApiOperation({ summary: 'Get department-level KPIs' })
  async getDepartmentKPIs(@Param('companyId') companyId: string) {
    return this.analyticsService.getDepartmentKPIs(companyId);
  }

  @Get('manager/:managerId/performance')
  @ApiOperation({ summary: 'Get manager performance metrics' })
  async getManagerPerformance(@Param('managerId') managerId: string) {
    return this.analyticsService.getManagerPerformance(managerId);
  }
}

