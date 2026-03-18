import { IsEmail, IsNotEmpty } from 'class-validator';

export class SendEmailOtpDto {
  @IsEmail()
  @IsNotEmpty()
  email: string;
}