import { Controller, Get, Query, UseGuards, Req, Res } from '@nestjs/common';
import type { Response } from 'express';
import { ExportService } from './export.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '../user/entities/user.entity';

@Controller('export')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ExportController {
  constructor(private readonly exportService: ExportService) {}

  @Get('users')
  @Roles(UserRole.COMPANY_ADMIN, UserRole.SUPER_ADMIN, UserRole.MANAGER)
  async exportUsers(
    @Req() req,
    @Res() res: Response,
    @Query('format') format?: string,
    @Query('role') role?: string,
    @Query('status') status?: string,
    @Query('department') department?: string,
  ) {
    const companyId = req.user.companyId?.toString() || req.user.companyId;
    const buffer = await this.exportService.exportUsersToCSV(companyId, {
      role,
      status,
      department,
    });

    this.setCsvHeaders(res, 'users-export');
    return res.send(buffer);
  }

  @Get('tasks')
  @Roles(UserRole.COMPANY_ADMIN, UserRole.SUPER_ADMIN, UserRole.MANAGER)
  async exportTasks(
    @Req() req,
    @Res() res: Response,
    @Query('format') format?: string,
    @Query('status') status?: string,
    @Query('project') project?: string,
    @Query('priority') priority?: string,
    @Query('assignedTo') assignedTo?: string,
  ) {
    const companyId = req.user.companyId?.toString() || req.user.companyId;
    const buffer = await this.exportService.exportTasksToCSV(companyId, {
      status,
      project,
      priority,
      assignedTo,
    });

    this.setCsvHeaders(res, 'tasks-export');
    return res.send(buffer);
  }

  @Get('projects')
  @Roles(UserRole.COMPANY_ADMIN, UserRole.SUPER_ADMIN, UserRole.MANAGER)
  async exportProjects(
    @Req() req,
    @Res() res: Response,
    @Query('format') format?: string,
  ) {
    const companyId = req.user.companyId?.toString() || req.user.companyId;
    const buffer = await this.exportService.exportProjectsToCSV(companyId);

    this.setCsvHeaders(res, 'projects-export');
    return res.send(buffer);
  }

  @Get('audit-logs')
  @Roles(UserRole.COMPANY_ADMIN, UserRole.SUPER_ADMIN)
  async exportAuditLogs(
    @Req() req,
    @Res() res: Response,
    @Query('format') format?: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
    @Query('action') action?: string,
    @Query('resource') resource?: string,
  ) {
    const companyId = req.user.companyId?.toString() || req.user.companyId;
    const buffer = await this.exportService.exportAuditLogsToCSV(companyId, {
      from,
      to,
      action,
      resource,
    });

    this.setCsvHeaders(res, 'audit-logs-export');
    return res.send(buffer);
  }

  @Get('analytics')
  @Roles(UserRole.COMPANY_ADMIN, UserRole.SUPER_ADMIN, UserRole.MANAGER)
  async exportAnalytics(
    @Req() req,
    @Res() res: Response,
    @Query('format') format?: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    const companyId = req.user.companyId?.toString() || req.user.companyId;
    const buffer = await this.exportService.exportAnalyticsToCSV(companyId, {
      from,
      to,
    });

    this.setCsvHeaders(res, 'analytics-export');
    return res.send(buffer);
  }

  /**
   * Set standard CSV download response headers.
   */
  private setCsvHeaders(res: Response, filenamePrefix: string): void {
    const timestamp = new Date().toISOString().split('T')[0];
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="${filenamePrefix}-${timestamp}.csv"`,
    );
  }
}
