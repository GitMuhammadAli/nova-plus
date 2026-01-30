import { IsString, IsOptional, IsObject } from 'class-validator';

export class CreateAuditLogDto {
  @IsString()
  action: string;

  @IsString()
  resource: string;

  @IsString()
  @IsOptional()
  resourceId?: string;

  @IsString()
  @IsOptional()
  tenantId?: string;

  @IsString()
  @IsOptional()
  userId?: string;

  @IsObject()
  @IsOptional()
  changes?: Record<string, any>;

  @IsObject()
  @IsOptional()
  metadata?: Record<string, any>;
}

