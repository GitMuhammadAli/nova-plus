import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type CompanyDocument = Company & Document;

@Schema({ timestamps: true })
export class Company {
  readonly _id?: string;

  @Prop({ required: true })
  name: string;

  @Prop({ required: false })
  domain?: string;

  @Prop({ required: false })
  description?: string;

  @Prop({ required: false })
  logoUrl?: string;

  @Prop({ type: Types.ObjectId, ref: 'User', required: false })
  createdBy?: Types.ObjectId; // Super Admin who created the company (null for self-registration)

  @Prop({ type: [{ type: Types.ObjectId, ref: 'User' }], default: [] })
  managers: Types.ObjectId[]; // Company admins and managers

  @Prop({ type: [{ type: Types.ObjectId, ref: 'User' }], default: [] })
  users: Types.ObjectId[]; // All users in the company

  @Prop({ default: true })
  isActive: boolean;
}

export const CompanySchema = SchemaFactory.createForClass(Company);
