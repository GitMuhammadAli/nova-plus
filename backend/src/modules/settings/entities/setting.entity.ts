import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type SettingDocument = Setting & Document;

export enum SettingType {
  COMPANY = 'company',
  BRANDING = 'branding',
  PERMISSIONS = 'permissions',
  NOTIFICATIONS = 'notifications',
  WORK_HOURS = 'work_hours',
  GENERAL = 'general',
}

@Schema({ timestamps: true })
export class Setting {
  readonly _id?: string;

  @Prop({ required: true, indexed: true })
  key: string;

  @Prop({ type: Object, required: true })
  value: any;

  @Prop({
    type: String,
    enum: SettingType,
    default: SettingType.GENERAL,
    indexed: true,
  })
  type: SettingType;

  @Prop({ type: Types.ObjectId, ref: 'Company', required: true, indexed: true })
  companyId: Types.ObjectId;

  @Prop({ type: String })
  description?: string;

  @Prop({ default: true })
  isActive: boolean;
}

export const SettingSchema = SchemaFactory.createForClass(Setting);

// Indexes
SettingSchema.index({ companyId: 1, key: 1 }, { unique: true });
SettingSchema.index({ companyId: 1, type: 1 });
