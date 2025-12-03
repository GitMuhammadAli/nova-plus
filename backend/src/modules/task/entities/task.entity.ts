import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { User } from '../../user/entities/user.entity';
import { Team } from './../../team/entities/team.entity';
import { Project } from '../../project/entities/project.entity';
import { Company } from '../../company/entities/company.entity';

export type TaskDocument = Task & Document;

export enum TaskStatus {
  TODO = 'todo',
  PENDING = 'pending',
  IN_PROGRESS = 'in_progress',
  REVIEW = 'review',
  DONE = 'done',
  CANCELLED = 'cancelled',
}

export enum TaskPriority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
}

@Schema({ timestamps: true })
export class Task {
  @Prop({ required: true })
  title: string;

  @Prop()
  description?: string;

  @Prop({ type: Types.ObjectId, ref: 'Project' })
  projectId?: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Company', required: true })
  companyId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  assignedBy: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  assignedTo: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Team' })
  team?: Types.ObjectId;

  @Prop({ enum: TaskStatus, default: TaskStatus.PENDING })
  status: TaskStatus;

  @Prop({ enum: TaskPriority, default: TaskPriority.MEDIUM })
  priority: TaskPriority;

  @Prop({ type: [{ 
    userId: { type: Types.ObjectId, ref: 'User' },
    comment: String,
    createdAt: { type: Date, default: Date.now }
  }], default: [] })
  comments: Array<{
    userId: Types.ObjectId;
    comment: string;
    createdAt: Date;
  }>;

  @Prop({ type: [{ 
    filename: String,
    url: String,
    uploadedBy: { type: Types.ObjectId, ref: 'User' },
    uploadedAt: { type: Date, default: Date.now },
    size: Number,
    mimeType: String
  }], default: [] })
  attachments: Array<{
    filename: string;
    url: string;
    uploadedBy: Types.ObjectId;
    uploadedAt: Date;
    size?: number;
    mimeType?: string;
  }>;

  @Prop({ type: Types.ObjectId, ref: 'Department' })
  departmentId?: Types.ObjectId;

  @Prop({ type: [{ 
    taskId: { type: Types.ObjectId, ref: 'Task' },
    type: { type: String, enum: ['blocks', 'depends_on', 'related'] }
  }], default: [] })
  dependencies: Array<{
    taskId: Types.ObjectId;
    type: 'blocks' | 'depends_on' | 'related';
  }>;

  @Prop({
    type: {
      enabled: { type: Boolean, default: false },
      interval: { type: String, enum: ['daily', 'weekly', 'monthly'] },
      cron: String,
      nextRun: Date,
      endDate: Date
    },
    default: { enabled: false }
  })
  recurring?: {
    enabled: boolean;
    interval?: 'daily' | 'weekly' | 'monthly';
    cron?: string;
    nextRun?: Date;
    endDate?: Date;
  };

  @Prop({ type: Types.ObjectId, ref: 'TaskTemplate' })
  templateId?: Types.ObjectId;

  @Prop({ type: [{ 
    userId: { type: Types.ObjectId, ref: 'User' },
    startAt: Date,
    endAt: Date,
    seconds: Number
  }], default: [] })
  timeLogs: Array<{
    userId: Types.ObjectId;
    startAt: Date;
    endAt?: Date;
    seconds?: number;
  }>;

  @Prop({ type: [{ type: Types.ObjectId, ref: 'User' }], default: [] })
  watchers: Types.ObjectId[];

  @Prop()
  dueDate?: Date;

  @Prop({ default: true })
  isActive: boolean;
}

export const TaskSchema = SchemaFactory.createForClass(Task);

// Indexes for better query performance
TaskSchema.index({ projectId: 1 });
TaskSchema.index({ companyId: 1 });
TaskSchema.index({ departmentId: 1 });
TaskSchema.index({ assignedTo: 1 });
TaskSchema.index({ status: 1 });
TaskSchema.index({ priority: 1 });
TaskSchema.index({ 'recurring.nextRun': 1 });
TaskSchema.index({ 'recurring.enabled': 1 });
TaskSchema.index({ createdAt: -1 });
