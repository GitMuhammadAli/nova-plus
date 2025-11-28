import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type WorkflowExecutionDocument = WorkflowExecution & Document;

export enum ExecutionStatus {
  RUNNING = 'running',
  COMPLETED = 'completed',
  FAILED = 'failed',
  CANCELLED = 'cancelled',
}

export enum StepStatus {
  PENDING = 'pending',
  RUNNING = 'running',
  SUCCESS = 'success',
  FAILED = 'failed',
  SKIPPED = 'skipped',
}

export interface ExecutionStep {
  id: string;
  nodeId: string;
  nodeName: string;
  status: StepStatus;
  startTime: Date;
  endTime?: Date;
  error?: string;
  output?: any;
}

@Schema({ timestamps: true })
export class WorkflowExecution {
  readonly _id?: string;

  @Prop({ type: Types.ObjectId, ref: 'Workflow', required: true, index: true })
  workflowId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Company', required: true, index: true })
  companyId: Types.ObjectId;

  @Prop({ type: String, enum: ExecutionStatus, default: ExecutionStatus.RUNNING, index: true })
  status: ExecutionStatus;

  @Prop({ type: Object, required: true })
  triggerData: any;

  @Prop({ type: [Object], required: true, default: [] })
  steps: ExecutionStep[];

  @Prop({ default: Date.now, index: true })
  startedAt: Date;

  @Prop()
  completedAt?: Date;

  @Prop()
  error?: string;
}

export const WorkflowExecutionSchema = SchemaFactory.createForClass(WorkflowExecution);

// Indexes
WorkflowExecutionSchema.index({ workflowId: 1, startedAt: -1 });
WorkflowExecutionSchema.index({ companyId: 1, startedAt: -1 });
WorkflowExecutionSchema.index({ status: 1 });

