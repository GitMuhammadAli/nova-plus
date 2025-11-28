import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type AnalyticsVisitDocument = AnalyticsVisit & Document;

@Schema({ timestamps: true })
export class AnalyticsVisit {
  readonly _id?: string;

  @Prop({ type: Types.ObjectId, ref: 'Company', required: true, indexed: true })
  companyId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User', required: false, indexed: true })
  userId?: Types.ObjectId;

  @Prop({ required: true, indexed: true })
  page: string; // e.g., '/dashboard', '/users', '/projects'

  @Prop()
  referrer?: string;

  @Prop()
  userAgent?: string;

  @Prop()
  ipAddress?: string;

  @Prop()
  device?: string; // 'desktop', 'mobile', 'tablet'

  @Prop()
  browser?: string;

  @Prop()
  os?: string;

  @Prop({ default: 0 })
  duration?: number; // Time spent on page in seconds

  @Prop({ default: Date.now, indexed: true })
  visitedAt: Date;
}

export const AnalyticsVisitSchema = SchemaFactory.createForClass(AnalyticsVisit);

// Indexes for performance
AnalyticsVisitSchema.index({ companyId: 1, visitedAt: -1 });
AnalyticsVisitSchema.index({ companyId: 1, page: 1, visitedAt: -1 });
AnalyticsVisitSchema.index({ userId: 1, visitedAt: -1 });
AnalyticsVisitSchema.index({ device: 1, visitedAt: -1 });

