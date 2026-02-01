import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type WorkflowDocument = Workflow & Document;

export enum WorkflowStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  DRAFT = 'draft',
}

export enum TriggerType {
  USER_CREATED = 'user_created',
  USER_UPDATED = 'user_updated',
  ORDER_PLACED = 'order_placed',
  PAYMENT_RECEIVED = 'payment_received',
  FORM_SUBMITTED = 'form_submitted',
  SCHEDULE = 'schedule',
  WEBHOOK = 'webhook',
}

export enum ActionType {
  SEND_EMAIL = 'send_email',
  SEND_SMS = 'send_sms',
  CREATE_TASK = 'create_task',
  UPDATE_RECORD = 'update_record',
  CALL_WEBHOOK = 'call_webhook',
  SEND_NOTIFICATION = 'send_notification',
  LOG_EVENT = 'log_event',
}

export interface WorkflowNode {
  id: string;
  type: 'trigger' | 'action';
  triggerType?: TriggerType;
  actionType?: ActionType;
  config: Record<string, any>;
  position: { x: number; y: number };
}

export interface Condition {
  id: string;
  field: string;
  operator:
    | 'equals'
    | 'not_equals'
    | 'contains'
    | 'not_contains'
    | 'greater_than'
    | 'less_than'
    | 'starts_with'
    | 'ends_with';
  value: string;
}

export interface WorkflowConnection {
  id: string;
  source: string;
  target: string;
  conditions?: Condition[];
  logic?: 'AND' | 'OR';
}

@Schema({ timestamps: true })
export class Workflow {
  readonly _id?: string;

  @Prop({ required: true })
  name: string;

  @Prop()
  description?: string;

  @Prop({ type: Types.ObjectId, ref: 'Company', required: true, index: true })
  companyId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true, index: true })
  createdBy: Types.ObjectId;

  @Prop({
    type: String,
    enum: WorkflowStatus,
    default: WorkflowStatus.DRAFT,
    index: true,
  })
  status: WorkflowStatus;

  @Prop({ type: [Object], required: true })
  nodes: WorkflowNode[];

  @Prop({ type: [Object], required: true, default: [] })
  connections: WorkflowConnection[];

  @Prop({ default: 0 })
  runCount: number;

  @Prop()
  lastRun?: Date;

  @Prop({ type: [String], default: [] })
  tags?: string[];

  @Prop({ default: true })
  isActive: boolean;
}

export const WorkflowSchema = SchemaFactory.createForClass(Workflow);

// Indexes for performance
WorkflowSchema.index({ companyId: 1, status: 1 });
WorkflowSchema.index({ createdBy: 1 });
WorkflowSchema.index({ status: 1 });
