import { Injectable, Inject } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import {
  AuditLog,
  AuditLogDocument,
  AuditAction,
  AuditResource,
} from './entities/audit-log.entity';
import { Types } from 'mongoose';

export interface CreateAuditLogDto {
  action: AuditAction;
  resource: AuditResource;
  userId?: Types.ObjectId | string;
  userName?: string;
  companyId: Types.ObjectId | string;
  resourceId?: Types.ObjectId | string;
  metadata?: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
  description?: string;
}

@Injectable()
export class AuditService {
  constructor(
    @InjectModel(AuditLog.name) private auditLogModel: Model<AuditLogDocument>,
  ) {}

  async createLog(dto: CreateAuditLogDto): Promise<AuditLogDocument> {
    const log = new this.auditLogModel({
      ...dto,
      companyId: new Types.ObjectId(dto.companyId),
      userId: dto.userId ? new Types.ObjectId(dto.userId) : undefined,
      resourceId: dto.resourceId
        ? new Types.ObjectId(dto.resourceId)
        : undefined,
    });
    return log.save();
  }

  async getLogs(
    companyId: string,
    options: {
      page?: number;
      limit?: number;
      userId?: string;
      resource?: AuditResource;
      action?: AuditAction;
      startDate?: Date;
      endDate?: Date;
    } = {},
  ) {
    const {
      page = 1,
      limit = 50,
      userId,
      resource,
      action,
      startDate,
      endDate,
    } = options;

    const query: any = {
      companyId: new Types.ObjectId(companyId),
    };

    if (userId) {
      query.userId = new Types.ObjectId(userId);
    }

    if (resource) {
      query.resource = resource;
    }

    if (action) {
      query.action = action;
    }

    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = startDate;
      if (endDate) query.createdAt.$lte = endDate;
    }

    const skip = (page - 1) * limit;

    const [logs, total] = await Promise.all([
      this.auditLogModel
        .find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate('userId', 'name email')
        .lean(),
      this.auditLogModel.countDocuments(query),
    ]);

    return {
      logs,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    };
  }

  async getRecentActivity(companyId: string, limit: number = 20) {
    return this.auditLogModel
      .find({ companyId: new Types.ObjectId(companyId) })
      .sort({ createdAt: -1 })
      .limit(limit)
      .populate('userId', 'name email')
      .lean();
  }
}
