import { IsEmail, IsNotEmpty, IsString, Matches, MinLength } from 'class-validator';

export class ResetPasswordWithOtpDto {
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsNotEmpty()
  @Matches(/^\d{6}$/, { message: 'OTP must be a 6 digit code' })
  otp: string;

  @IsString()
  @MinLength(6)
  newPassword: string;
}