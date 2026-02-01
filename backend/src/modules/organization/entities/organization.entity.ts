import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type OrganizationDocument = Organization & Document;

@Schema({ timestamps: true })
export class Organization {
  readonly _id?: string;

  @Prop({ required: true })
  name: string;

  @Prop({ required: true, unique: true })
  slug: string; // e.g., "acme-corp"

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  owner: Types.ObjectId; // Admin who created the org

  @Prop({ type: [{ type: Types.ObjectId, ref: 'User' }], default: [] })
  members: Types.ObjectId[];

  @Prop({ default: true })
  isActive: boolean;

  @Prop()
  description?: string;

  @Prop()
  logo?: string;
}

export const OrganizationSchema = SchemaFactory.createForClass(Organization);
