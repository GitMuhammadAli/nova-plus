import { IsString, IsEmail, IsNotEmpty, IsOptional, MinLength, IsUrl } from 'class-validator';

export class RegisterCompanyDto {
  @IsString()
  @IsNotEmpty()
  companyName: string;

  @IsString()
  @IsOptional()
  domain?: string;

  @IsString()
  @IsOptional()
  adminName?: string; // Optional - will use email prefix if not provided

  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(6)
  password: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @IsOptional()
  @IsUrl({}, { message: 'logoUrl must be a valid URL' })
  logoUrl?: string;
}

