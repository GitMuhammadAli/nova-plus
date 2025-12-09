import { IsOptional, IsBoolean, IsString } from 'class-validator';

export class UpdateUploadDto {
  @IsOptional()
  @IsString()
  filename?: string;

  @IsOptional()
  @IsBoolean()
  isPublic?: boolean;

  @IsOptional()
  @IsString()
  category?: string;
}
