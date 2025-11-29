import { IsString, IsNotEmpty, Length } from 'class-validator';

export class VerifyMfaDto {
  @IsString()
  @IsNotEmpty()
  @Length(6, 6)
  token: string;
}

export class DisableMfaDto {
  @IsString()
  @IsNotEmpty()
  password: string; // Require password confirmation
}

