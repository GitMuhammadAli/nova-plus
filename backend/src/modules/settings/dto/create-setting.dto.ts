import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsEnum,
  IsObject,
  IsBoolean,
} from 'class-validator';
import { SettingType } from '../entities/setting.entity';

export class CreateSettingDto {
  @IsString()
  @IsNotEmpty()
  key: string;

  @IsObject()
  @IsNotEmpty()
  value: any;

  @IsEnum(SettingType)
  @IsOptional()
  type?: SettingType;

  @IsString()
  @IsOptional()
  description?: string;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}
