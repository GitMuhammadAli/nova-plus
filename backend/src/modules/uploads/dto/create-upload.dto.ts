import { IsOptional, IsString, IsEnum } from 'class-validator';

export enum UploadCategory {
  GENERAL = 'general',
  DOCUMENT = 'document',
  IMAGE = 'image',
  VIDEO = 'video',
  AUDIO = 'audio',
}

export class CreateUploadDto {
  @IsOptional()
  @IsString()
  category?: string;

  @IsOptional()
  @IsString()
  folder?: string;

  @IsOptional()
  @IsString()
  expiresInDays?: number; // For temporary uploads
}
