import {
  IsEmail,
  IsString,
  IsOptional,
  IsIn,
  IsNumber,
  Min,
  Max,
} from 'class-validator';
import { Transform } from 'class-transformer';
import { UserRole } from '../../user/entities/user.entity';

export class CreateInviteDto {
  @IsEmail()
  @IsOptional()
  email?: string; // Optional: invite specific email, or leave empty for open invite

  @IsString()
  @IsIn(['user', 'manager', 'USER', 'MANAGER'], {
    message: 'Role must be either "user" or "manager"',
  })
  @Transform(({ value }) => {
    // Normalize role to lowercase enum value
    if (typeof value === 'string') {
      const normalized = value.toLowerCase().trim();

      // Reject admin roles
      if (
        normalized === 'company_admin' ||
        normalized === 'admin' ||
        normalized === 'super_admin'
      ) {
        throw new Error(
          'Cannot invite users as admin. Use "user" or "manager"',
        );
      }

      // Map to enum values
      if (normalized === 'user') {
        return UserRole.USER; // Returns 'user'
      }
      if (normalized === 'manager') {
        return UserRole.MANAGER; // Returns 'manager'
      }

      return value;
    }
    return value;
  })
  role: UserRole.USER | UserRole.MANAGER; // 'manager' or 'user' (cannot invite as admin)

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(365)
  @Transform(({ value }) => {
    // Convert string to number if needed
    if (typeof value === 'string') {
      const num = parseInt(value, 10);
      return isNaN(num) ? undefined : num;
    }
    return value;
  })
  expiresInDays?: number; // Optional: custom expiration (default 7 days)

  @IsOptional()
  @IsString()
  departmentId?: string; // Optional: assign to department on invite acceptance
}
