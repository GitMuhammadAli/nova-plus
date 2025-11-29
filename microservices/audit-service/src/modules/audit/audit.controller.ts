import { Controller, Post, Get, Query, Param, Res } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { Response } from 'express';
import { AuditService } from './audit.service';
import { CreateAuditLogDto } from './dto/create-audit-log.dto';
import { SearchAuditLogsDto } from './dto/search-audit-logs.dto';

@ApiTags('Audit')
@Controller()
export class AuditController {
  constructor(private readonly auditService: AuditService) {}

  @Post()
  @ApiOperation({ summary: 'Create audit log entry' })
  async create(@Query() dto: CreateAuditLogDto) {
    return this.auditService.create(dto);
  }

  @Get('search')
  @ApiOperation({ summary: 'Search audit logs' })
  @ApiQuery({ name: 'tenantId', required: false })
  @ApiQuery({ name: 'userId', required: false })
  @ApiQuery({ name: 'action', required: false })
  @ApiQuery({ name: 'resource', required: false })
  @ApiQuery({ name: 'startDate', required: false })
  @ApiQuery({ name: 'endDate', required: false })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  async search(@Query() dto: SearchAuditLogsDto) {
    return this.auditService.search(dto);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get audit log by ID' })
  async findById(@Param('id') id: string) {
    return this.auditService.findById(id);
  }

  @Get('export/csv')
  @ApiOperation({ summary: 'Export audit logs to CSV' })
  async export(@Query() dto: SearchAuditLogsDto, @Res() res: Response) {
    const csv = await this.auditService.export(dto);
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=audit-logs.csv');
    res.send(csv);
  }
}

