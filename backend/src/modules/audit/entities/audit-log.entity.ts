import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type AuditLogDocument = AuditLog & Document;

export enum AuditAction {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LOGIN = 'login',
  LOGOUT = 'logout',
  INVITE_SENT = 'invite_sent',
  INVITE_ACCEPTED = 'invite_accepted',
  USER_ASSIGNED = 'user_assigned',
  ROLE_CHANGED = 'role_changed',
  SETTINGS_UPDATED = 'settings_updated',
  DEPARTMENT_CREATED = 'department_created',
  DEPARTMENT_UPDATED = 'department_updated',
  DEPARTMENT_DELETED = 'department_deleted',
}

export enum AuditResource {
  USER = 'user',
  COMPANY = 'company',
  DEPARTMENT = 'department',
  TEAM = 'team',
  INVITE = 'invite',
  SETTINGS = 'settings',
  PROJECT = 'project',
  TASK = 'task',
}

@Schema({ timestamps: true })
export class AuditLog {
  readonly _id?: string;

  @Prop({ type: String, enum: AuditAction, required: true, indexed: true })
  action: AuditAction;

  @Prop({ type: String, enum: AuditResource, required: true, indexed: true })
  resource: AuditResource;

  @Prop({ type: Types.ObjectId, ref: 'User', required: false, indexed: true })
  userId?: Types.ObjectId;

  @Prop({ type: String })
  userName?: string;

  @Prop({ type: Types.ObjectId, ref: 'Company', required: true, indexed: true })
  companyId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, refPath: 'resource' })
  resourceId?: Types.ObjectId;

  @Prop({ type: Object })
  metadata?: Record<string, any>;

  @Prop({ type: String })
  ipAddress?: string;

  @Prop({ type: String })
  userAgent?: string;

  @Prop({ type: String })
  description?: string;
}

export const AuditLogSchema = SchemaFactory.createForClass(AuditLog);

// Indexes for performance
AuditLogSchema.index({ companyId: 1, createdAt: -1 });
AuditLogSchema.index({ userId: 1, createdAt: -1 });
AuditLogSchema.index({ resource: 1, resourceId: 1 });
AuditLogSchema.index({ action: 1, createdAt: -1 });

