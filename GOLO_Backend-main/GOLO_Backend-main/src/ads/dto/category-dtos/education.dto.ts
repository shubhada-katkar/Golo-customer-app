import { IsEnum, IsString, IsOptional, IsNumber, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class EducationDto {

  @IsEnum(['tuition', 'coaching', 'online course', 'workshop', 'other'])
  courseType: string;

  @IsEnum(['online', 'offline'])
  modeOfEducation: string;

  @IsEnum(['yes', 'no'])
  demoAvailable: string;

  @IsOptional()
  @IsString()
  class?: string;

  @IsOptional()
  @IsString()
  subject?: string;

  @IsOptional()
  @IsString()
  institute?: string;

  @IsOptional()
  @IsString()
  duration?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  fees?: number;

  @IsOptional()
  @IsString()
  experience?: string;

  @IsOptional()
  @IsString()
  qualification?: string;
}