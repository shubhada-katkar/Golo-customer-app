import {
  IsEnum,
  IsString,
  IsOptional,
  IsNumber,
  IsBoolean,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';

export class EmploymentDto {

  @IsEnum(['full time', 'part time', 'contract'])
  employmentType: string;

  @IsEnum(['entry level', 'mid level', 'senior level'])
  experienceLevel: string;

  @IsOptional()
  @IsString()
  industry?: string;

  @IsOptional()
  @IsString()
  salaryRangeMin?: string;

  @IsOptional()
  @IsString()
  salaryRangeMax?: string;

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Type(() => Number)
  vacancies?: number;

  @IsOptional()
  @IsBoolean()
  insurance?: boolean;

  @IsOptional()
  @IsBoolean()
  paidoff?: boolean;

  @IsOptional()
  @IsBoolean()
  workFromHome?: boolean;

  @IsOptional()
  @IsBoolean()
  annualBonus?: boolean;
}