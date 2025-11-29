import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type WebhookDocument = Webhook & Document;

@Schema({ timestamps: true })
export class Webhook {
  readonly _id?: string;

  @Prop({ type: Types.ObjectId, ref: 'Company', required: true, indexed: true })
  companyId: Types.ObjectId;

  @Prop({ required: true })
  url: string;

  @Prop({ required: true })
  secret: string; // HMAC secret for signing

  @Prop({ type: [String], required: true, default: [] })
  events: string[]; // e.g., ['task.created', 'task.updated', 'user.created']

  @Prop({ default: 3 })
  retries: number; // Max retry attempts

  @Prop({ default: true })
  isActive: boolean;

  @Prop({ type: Types.ObjectId, ref: 'User' })
  createdBy?: Types.ObjectId;

  @Prop()
  lastStatus?: string; // 'success' | 'failed' | 'pending'

  @Prop()
  lastAttemptAt?: Date;

  @Prop()
  description?: string;
}

export const WebhookSchema = SchemaFactory.createForClass(Webhook);

// Indexes
WebhookSchema.index({ companyId: 1, isActive: 1 });
WebhookSchema.index({ companyId: 1, events: 1 });

