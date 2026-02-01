import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type WebhookLogDocument = WebhookLog & Document;

@Schema({ timestamps: true })
export class WebhookLog {
  readonly _id?: string;

  @Prop({ type: Types.ObjectId, ref: 'Webhook', required: true, indexed: true })
  webhookId: Types.ObjectId;

  @Prop({ required: true })
  event: string;

  @Prop({ type: Object })
  payload: any;

  @Prop()
  status: string; // 'success' | 'failed' | 'pending'

  @Prop()
  statusCode?: number;

  @Prop()
  responseBody?: string;

  @Prop()
  errorMessage?: string;

  @Prop()
  attempt: number;

  @Prop()
  deliveredAt?: Date;

  @Prop()
  duration?: number; // milliseconds
}

export const WebhookLogSchema = SchemaFactory.createForClass(WebhookLog);

// Indexes
WebhookLogSchema.index({ webhookId: 1, createdAt: -1 });
WebhookLogSchema.index({ status: 1, createdAt: -1 });
