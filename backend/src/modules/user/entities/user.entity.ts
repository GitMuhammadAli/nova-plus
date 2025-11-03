import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type UserDocument = User & Document ;

export enum UserRole {
  ADMIN = 'admin',
  MANAGER = 'manager',
  EDITOR = 'editor',
  VIEWER = 'viewer',
  USER = 'user',
  SUPERADMIN = 'superadmin',
}

@Schema({ timestamps: true })
export class User {
  toObject(): { [x: string]: any; password: any; } {
    throw new Error('Method not implemented.');
  }
  toObject(): { [x: string]: any; password: any; } {
    throw new Error('Method not implemented.');
  }
  toObject(): { [x: string]: any; password: any; } {
    throw new Error('Method not implemented.');
  }

  readonly _id?: string;

  @Prop({ required: true, unique: true })
  email: string;

  @Prop({ required: true })
  password: string;

  @Prop({ default: 'User' })
  name: string;

  @Prop({ type: String, enum: UserRole, default: UserRole.USER })
  role: UserRole;

  @Prop({ type: String, ref: 'User' })
  createdBy?: string; // Who created this user (Admin or Manager ID)

  @Prop({ type: String, ref: 'User' })
  managerId?: string; // For users: their manager reference (only for role: 'user')
}

export const UserSchema = SchemaFactory.createForClass(User);
