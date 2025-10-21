import { IsEmail, IsNotEmpty, MinLength } from 'class-validator';

export class LoginDto {
  @IsNotEmpty()
  tenantId: string;

  @IsEmail()
  email: string;

  @MinLength(8)
  password: string;
}
