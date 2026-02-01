import {
  IsString,
  IsEmail,
  MinLength,
  IsOptional,
  Matches,
} from 'class-validator';

export class CreateOrganizationDto {
  @IsString()
  @MinLength(2)
  name: string;

  @IsString()
  @Matches(/^[a-z0-9-]+$/, {
    message: 'Slug must contain only lowercase letters, numbers, and hyphens',
  })
  slug: string;

  @IsOptional()
  @IsString()
  description?: string;

  // Admin user details
  @IsEmail()
  adminEmail: string;

  @IsString()
  @MinLength(6)
  adminPassword: string;

  @IsString()
  @MinLength(2)
  adminName: string;
}
