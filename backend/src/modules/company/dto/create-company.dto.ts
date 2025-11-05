import { IsString, IsEmail, IsOptional, IsNotEmpty } from 'class-validator';

export class CreateCompanyDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsOptional()
  domain?: string;

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

