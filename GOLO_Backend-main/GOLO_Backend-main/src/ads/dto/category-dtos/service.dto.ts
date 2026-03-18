import { IsString, IsOptional, IsBoolean } from 'class-validator';

export class ServiceDto {

  @IsString()
  serviceCategory: string;

  @IsOptional()
  @IsString()
  experience?: string;

  @IsOptional()
  @IsString()
  serviceArea?: string;

  @IsOptional()
  @IsString()
  availableTime?: string;

  @IsOptional()
  @IsString()
  charges?: string;

  @IsOptional()
  @IsBoolean()
  emergencyService?: boolean;

  @IsOptional()
  @IsString()
  serviceBio?: string;
}