import { IsEmail, IsNotEmpty, Matches } from 'class-validator';

export class VerifyEmailOtpDto {
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsNotEmpty()
  @Matches(/^\d{6}$/, { message: 'OTP must be a 6 digit code' })
  otp: string;
}