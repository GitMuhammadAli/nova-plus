import {
  IsString,
  IsEmail,
  IsOptional,
  IsNotEmpty,
  IsUrl,
} from 'class-validator';

export class CreateCompanyDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsOptional()
  domain?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @IsOptional()
  @IsUrl({}, { message: 'logoUrl must be a valid URL' })
  logoUrl?: string;

  @IsString()
  @IsEmail()
  @IsNotEmpty()
  companyAdminEmail: string;

  @IsString()
  @IsNotEmpty()
  companyAdminName: string;

  @IsString()
  @IsNotEmpty()
  companyAdminPassword: string;
}
