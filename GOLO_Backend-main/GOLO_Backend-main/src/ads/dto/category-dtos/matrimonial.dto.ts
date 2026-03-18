import {
  IsString,
  IsNumber,
  IsOptional,
  Min,
  Max,
  IsEnum
} from 'class-validator';
import { Type } from 'class-transformer';

export class MatrimonialDto {

  @IsEnum(['self', 'relative', 'friend', 'other'])
  profileFor: string;

  @IsString()
  name: string;

  @IsNumber()
  @Min(18)
  @Max(100)
  @Type(() => Number)
  age: number;

  @IsEnum(['male', 'female', 'other'])
  gender: string;

  @IsOptional()
  @IsString()
  maritalStatus?: string;

  @IsOptional()
  @IsString()
  religion?: string;

  @IsOptional()
  @IsString()
  caste?: string;

  @IsOptional()
  @IsString()
  education?: string;

  @IsOptional()
  @IsString()
  occupation?: string;

  @IsOptional()
  @IsString()
  annualIncome?: string;

  @IsOptional()
  @IsString()
  height?: string;

  @IsOptional()
  @IsString()
  location?: string;

  @IsOptional()
  @IsString()
  aboutMe?: string;

  @IsOptional()
  @IsString()
  partnerPreference?: string;
}