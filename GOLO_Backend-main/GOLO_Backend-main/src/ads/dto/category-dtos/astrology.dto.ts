import { IsBoolean, IsString, IsOptional, IsEnum } from 'class-validator';

export class AstrologyDto {

  @IsOptional()
  @IsBoolean()
  horoscope?: boolean;

  @IsOptional()
  @IsBoolean()
  kundli?: boolean;

  @IsOptional()
  @IsBoolean()
  vaastu?: boolean;

  @IsOptional()
  @IsBoolean()
  palm?: boolean;

  @IsOptional()
  @IsString()
  experience?: string;

  @IsOptional()
  @IsString()
  language?: string;

  @IsOptional()
  @IsEnum(['call', 'email'])
  contactMethod?: string;

  @IsOptional()
  @IsEnum(['online', 'offline'])
  demoAvailable?: string;

  @IsOptional()
  @IsString()
  fee?: string;

  @IsOptional()
  @IsString()
  availabilityTime?: string;
}