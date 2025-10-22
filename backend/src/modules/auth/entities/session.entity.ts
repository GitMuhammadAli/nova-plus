import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

@Schema({ timestamps: true })
export class Session extends Document {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  userId: Types.ObjectId;

  @Prop({ required: true })
  refreshTokenHash: string;

  @Prop()
  userAgent: string;

  @Prop()
  ip: string;

  @Prop({ default: Date.now })
  lastUsedAt: Date;
}

export const SessionSchema = SchemaFactory.createForClass(Session);
