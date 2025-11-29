import { IsString, IsUrl, IsArray, IsOptional, IsBoolean, Min, Max } from 'class-validator';

export class CreateWebhookDto {
  @IsUrl()
  url: string;

  @IsArray()
  @IsString({ each: true })
  events: string[];

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @Min(1)
  @Max(10)
  retries?: number;
}

