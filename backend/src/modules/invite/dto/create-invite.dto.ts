import { IsEmail, IsString, IsOptional, IsEnum } from 'class-validator';
import { UserRole } from '../../user/entities/user.entity';

export class CreateInviteDto {
  @IsEmail()
  @IsOptional()
  email?: string; // Optional: invite specific email, or leave empty for open invite

  @IsEnum(UserRole)
  @IsString()
  role: UserRole; // 'manager' or 'user' (cannot invite as admin)

  @IsOptional()
  @IsString()
  expiresInDays?: number; // Optional: custom expiration (default 7 days)
}

