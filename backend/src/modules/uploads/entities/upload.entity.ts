import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type UploadDocument = Upload & Document;

@Schema({ timestamps: true })
export class Upload {
  @Prop({ required: true })
  filename: string;

  @Prop({ required: true })
  originalName: string;

  @Prop({ required: true })
  url: string;

  @Prop()
  thumbnailUrl?: string;

  @Prop({ required: true })
  mimeType: string;

  @Prop({ required: true })
  size: number;

  @Prop({ type: Types.ObjectId, ref: 'Company', required: true })
  companyId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  uploadedBy: Types.ObjectId;

  @Prop({ default: false })
  isPublic: boolean;

  @Prop()
  folder?: string;

  @Prop()
  publicId?: string; // Cloudinary public ID

  @Prop({ default: 'general' })
  category?: string; // e.g., 'document', 'image', 'video'

  @Prop({ type: Date })
  expiresAt?: Date; // For temporary uploads

  @Prop({ default: true })
  isActive: boolean;
}

export const UploadSchema = SchemaFactory.createForClass(Upload);

// Indexes
UploadSchema.index({ companyId: 1, createdAt: -1 });
UploadSchema.index({ uploadedBy: 1 });
UploadSchema.index({ publicId: 1 });
UploadSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 }); // Auto-delete expired uploads
