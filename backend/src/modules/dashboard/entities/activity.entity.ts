import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { User } from '../../user/entities/user.entity';

export type ActivityDocument = Activity & Document;

export enum ActivityType {
  USER_CREATED = 'user_created',
  USER_UPDATED = 'user_updated',
  USER_DELETED = 'user_deleted',
  TASK_CREATED = 'task_created',
  TASK_UPDATED = 'task_updated',
  TASK_COMPLETED = 'task_completed',
  AUTOMATION_TRIGGERED = 'automation_triggered',
  AUTOMATION_UPDATED = 'automation_updated',
  SETTINGS_UPDATED = 'settings_updated',
  REPORT_GENERATED = 'report_generated',
  FILE_UPLOADED = 'file_uploaded',
  FILE_DELETED = 'file_deleted',
  LOGIN = 'login',
  LOGOUT = 'logout',
  SYSTEM = 'system',
}

@Schema({ timestamps: true })
export class Activity {
  readonly _id?: Types.ObjectId | string;

  @Prop({ type: String, enum: ActivityType, required: true, index: true })
  type: ActivityType;

  @Prop({ type: Types.ObjectId, ref: 'User', index: true })
  userId?: Types.ObjectId;

  @Prop({ type: String })
  userName?: string;

  @Prop({ required: true })
  action: string;

  @Prop({ type: String })
  description?: string;

  @Prop({ type: String })
  target?: string;

  @Prop({ type: Object })
  metadata?: Record<string, any>;

  createdAt?: Date;
  updatedAt?: Date;
}

export const ActivitySchema = SchemaFactory.createForClass(Activity);

// Add indexes for better query performance
ActivitySchema.index({ createdAt: -1 });
ActivitySchema.index({ type: 1, createdAt: -1 });
