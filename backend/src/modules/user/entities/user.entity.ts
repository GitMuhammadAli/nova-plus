import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type UserDocument = User & Document;

export enum UserRole {
  SUPER_ADMIN = 'super_admin',
  COMPANY_ADMIN = 'company_admin',
  MANAGER = 'manager',
  USER = 'user',
  // Legacy roles for backward compatibility
  ADMIN = 'admin',
  EDITOR = 'editor',
  VIEWER = 'viewer',
  SUPERADMIN = 'superadmin',
}

@Schema({ timestamps: true })
export class User {
  readonly _id?: string;

  @Prop({ required: true, unique: true })
  email: string;

  @Prop({ required: true })
  password: string;

  @Prop({ default: 'User' })
  name: string;

  @Prop({ type: String, enum: UserRole, default: UserRole.USER })
  role: UserRole;

  @Prop({ type: Types.ObjectId, ref: 'Organization', required: false })
  orgId?: Types.ObjectId; // Organization this user belongs to (legacy, for backward compatibility)

  @Prop({ type: Types.ObjectId, ref: 'Company', required: false })
  companyId?: Types.ObjectId; // Company this user belongs to

  @Prop({ type: Types.ObjectId, ref: 'User' })
  createdBy?: Types.ObjectId; // Who created this user (Admin or Manager ID)

  @Prop({ type: Types.ObjectId, ref: 'User' })
  managerId?: Types.ObjectId; // For users: their manager reference (only for role: 'user')

  @Prop({ default: true })
  isActive: boolean;

  @Prop()
  department?: string;

  @Prop()
  location?: string;

  // Phase 4 additions
  @Prop()
  lastSeenAt?: Date;

  @Prop({
    type: [
      {
        deviceId: String,
        userAgent: String,
        ip: String,
        lastSeenAt: Date,
      },
    ],
    default: [],
  })
  devices?: Array<{
    deviceId: string;
    userAgent: string;
    ip: string;
    lastSeenAt: Date;
  }>;

  @Prop({
    type: {
      enabled: Boolean,
      secret: String,
      recoveryCodes: [String],
    },
    default: { enabled: false },
  })
  mfa?: {
    enabled: boolean;
    secret?: string;
    recoveryCodes?: string[];
  };

  @Prop({
    type: {
      department: String,
      location: String,
      level: String,
    },
    default: {},
  })
  abacAttributes?: {
    department?: string;
    location?: string;
    level?: string;
  };

  @Prop({ default: false })
  isSuspended?: boolean;
}

export const UserSchema = SchemaFactory.createForClass(User);
