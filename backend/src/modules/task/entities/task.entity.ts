import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { User } from '../../user/entities/user.entity';
import { Team } from './../../team/entities/team.entity';

export type TaskDocument = Task & Document;

export enum TaskStatus {
  TODO = 'TODO',
  IN_PROGRESS = 'IN_PROGRESS',
  DONE = 'DONE',
}

@Schema({ timestamps: true })
export class Task {
  @Prop({ required: true })
  title: string;

  @Prop()
  description?: string;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  assignedBy: User;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  assignedTo: User;

  @Prop({ type: Types.ObjectId, ref: 'Team' })
  team?: Team;

  @Prop({ enum: TaskStatus, default: TaskStatus.TODO })
  status: TaskStatus;
}

export const TaskSchema = SchemaFactory.createForClass(Task);
