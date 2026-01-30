import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty } from 'class-validator';

export class ValidateTokenDto {
  @ApiProperty({ description: 'JWT access token to validate' })
  @IsString()
  @IsNotEmpty()
  token: string;
}

export class ValidateResponseDto {
  @ApiProperty()
  valid: boolean;

  @ApiProperty()
  userId?: string;

  @ApiProperty()
  email?: string;

  @ApiProperty()
  role?: string;

  @ApiProperty()
  companyId?: string;

  @ApiProperty()
  sessionId?: string;

  @ApiProperty()
  expiresAt?: string;

  @ApiProperty({ nullable: true })
  device?: {
    type: string;
    os: string;
    browser: string;
  } | null;
}

