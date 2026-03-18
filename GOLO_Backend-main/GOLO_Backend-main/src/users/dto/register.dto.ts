import { IsString, IsEmail, IsNotEmpty, MinLength, IsOptional, Matches } from 'class-validator';

export class RegisterDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsString()
  @MinLength(6)
  password: string;

  @IsString()
  @IsNotEmpty()
  @Matches(/^\d{6}$/, { message: 'OTP must be a 6 digit code' })
  otp: string;

  @IsOptional()
  @Matches(/^\+?\d{7,15}$/, { message: 'Invalid phone number' })
  phone?: string;
}

// No separate Merchant DTO needed anymore