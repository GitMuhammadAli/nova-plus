import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { AuditLog } from './entities/audit-log.entity';
import { CreateAuditLogDto } from './dto/create-audit-log.dto';
import { SearchAuditLogsDto } from './dto/search-audit-logs.dto';
import logger from '../../common/logger';

@Injectable()
export class AuditService {
  constructor(
    @InjectModel(AuditLog.name) private auditLogModel: Model<AuditLog>,
  ) {}

  /**
   * Create audit log entry
   */
  async create(dto: CreateAuditLogDto): Promise<AuditLog> {
    try {
      const auditLog = new this.auditLogModel({
        ...dto,
        timestamp: new Date(),
      });

      const saved = await auditLog.save();

      logger.info('Audit log created', {
        auditLogId: saved._id.toString(),
        action: dto.action,
        resource: dto.resource,
      });

      return saved;
    } catch (error) {
      logger.error('Failed to create audit log', { error: error.message, dto });
      throw error;
    }
  }

  /**
   * Search audit logs
   */
  async search(dto: SearchAuditLogsDto): Promise<{
    logs: AuditLog[];
    total: number;
    page: number;
    limit: number;
  }> {
    const { tenantId, userId, action, resource, startDate, endDate, page = 1, limit = 50 } = dto;

    const query: any = {};

    if (tenantId) query.tenantId = tenantId;
    if (userId) query.userId = userId;
    if (action) query.action = action;
    if (resource) query.resource = resource;
    if (startDate || endDate) {
      query.timestamp = {};
      if (startDate) query.timestamp.$gte = new Date(startDate);
      if (endDate) query.timestamp.$lte = new Date(endDate);
    }

    const skip = (page - 1) * limit;

    const [logs, total] = await Promise.all([
      this.auditLogModel
        .find(query)
        .sort({ timestamp: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      this.auditLogModel.countDocuments(query),
    ]);

    return {
      logs: logs as AuditLog[],
      total,
      page,
      limit,
    };
  }

  /**
   * Get audit log by ID
   */
  async findById(id: string): Promise<AuditLog | null> {
    return this.auditLogModel.findById(id).lean();
  }

  /**
   * Export audit logs to CSV
   */
  async export(dto: SearchAuditLogsDto): Promise<string> {
    const { logs } = await this.search({ ...dto, limit: 10000 });

    // Convert to CSV
    const headers = ['Timestamp', 'Action', 'Resource', 'UserId', 'TenantId', 'Changes'];
    const rows = logs.map((log) => [
      log.timestamp.toISOString(),
      log.action,
      log.resource,
      log.userId || '',
      log.tenantId || '',
      JSON.stringify(log.changes || {}),
    ]);

    const csv = [
      headers.join(','),
      ...rows.map((row) => row.map((cell) => `"${cell}"`).join(',')),
    ].join('\n');

    return csv;
  }
}

