import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type IntegrationDocument = Integration & Document;

export enum IntegrationType {
  EMAIL = 'email',
  SLACK = 'slack',
  GOOGLE_OAUTH = 'google_oauth',
}

@Schema({ timestamps: true })
export class Integration {
  @Prop({ type: Types.ObjectId, ref: 'Company', required: true })
  companyId: Types.ObjectId;

  @Prop({ required: true, enum: IntegrationType })
  type: IntegrationType;

  @Prop({ required: true })
  name: string;

  @Prop({ type: Object, required: true })
  config: {
    // Encrypted secrets stored here
    [key: string]: any;
  };

  @Prop({ default: true })
  isActive: boolean;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  createdBy: Types.ObjectId;

  @Prop({ type: Object })
  metadata?: Record<string, any>;
}

export const IntegrationSchema = SchemaFactory.createForClass(Integration);

// Indexes
IntegrationSchema.index({ companyId: 1, type: 1 });
IntegrationSchema.index({ companyId: 1, isActive: 1 });

