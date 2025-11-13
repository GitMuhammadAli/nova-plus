import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type InviteDocument = Invite & Document;

@Schema({ timestamps: true })
export class Invite {
  readonly _id?: string;

  @Prop({ required: true, unique: true })
  token: string; // Unique invite token

  @Prop({ type: Types.ObjectId, ref: 'Company', required: true })
  companyId: Types.ObjectId; // Company the invite is for

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  createdBy: Types.ObjectId; // Who created the invite (Company Admin or Manager)

  @Prop({ required: false })
  email?: string; // Optional: specific email invite (for email-specific invites)

  @Prop({ type: String, required: true, default: 'user' })
  role: string; // Role to assign: 'manager' or 'user'

  @Prop({ default: false })
  isUsed: boolean; // Whether the invite has been accepted

  @Prop({ type: Types.ObjectId, ref: 'User' })
  usedBy?: Types.ObjectId; // User who accepted the invite

  @Prop()
  usedAt?: Date; // When the invite was accepted

  @Prop({ required: true })
  expiresAt: Date; // Expiration date (default 7 days)

  @Prop({ default: true })
  isActive: boolean; // Whether the invite is still active
}

export const InviteSchema = SchemaFactory.createForClass(Invite);

// Indexes for faster lookups
// Note: token index is automatically created by unique: true, so we don't need to add it manually
InviteSchema.index({ companyId: 1 });
InviteSchema.index({ email: 1 });
InviteSchema.index({ expiresAt: 1 });

