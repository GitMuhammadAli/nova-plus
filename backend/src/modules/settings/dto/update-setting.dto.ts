import { PartialType } from '@nestjs/mapped-types';
import { CreateSettingDto } from './create-setting.dto';
import { IsOptional, IsObject, IsBoolean } from 'class-validator';

export class UpdateSettingDto extends PartialType(CreateSettingDto) {
  @IsObject()
  @IsOptional()
  value?: any;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}
