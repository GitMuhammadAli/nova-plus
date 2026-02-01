import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type DepartmentDocument = Department & Document;

@Schema({ timestamps: true })
export class Department {
  readonly _id?: string;

  @Prop({ required: true, indexed: true })
  name: string;

  @Prop()
  description?: string;

  @Prop({ type: Types.ObjectId, ref: 'Company', required: true, indexed: true })
  companyId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User', required: false, indexed: true })
  managerId?: Types.ObjectId; // Manager assigned to this department

  @Prop({ type: [{ type: Types.ObjectId, ref: 'User' }], default: [] })
  members: Types.ObjectId[]; // All members in this department

  @Prop({ default: true })
  isActive: boolean;

  @Prop({ type: Types.ObjectId, ref: 'User' })
  createdBy?: Types.ObjectId;
}

export const DepartmentSchema = SchemaFactory.createForClass(Department);

// Indexes for performance
DepartmentSchema.index({ companyId: 1, name: 1 }, { unique: true });
DepartmentSchema.index({ managerId: 1 });
DepartmentSchema.index({ companyId: 1, isActive: 1 });
