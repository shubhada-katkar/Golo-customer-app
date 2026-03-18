import { IsString, IsOptional, IsBoolean } from 'class-validator';

export class PetsDto {

  @IsString()
  species: string;

  @IsOptional()
  @IsString()
  breed?: string;

  @IsOptional()
  @IsString()
  age?: string;

  @IsOptional()
  @IsString()
  gender?: string;

  @IsOptional()
  @IsString()
  weight?: string;

  @IsOptional()
  @IsBoolean()
  friendly?: boolean;

  @IsOptional()
  @IsBoolean()
  quiet?: boolean;

  @IsOptional()
  @IsBoolean()
  active?: boolean;

  @IsOptional()
  @IsBoolean()
  protective?: boolean;

  @IsOptional()
  @IsBoolean()
  kidfriendly?: boolean;

  @IsOptional()
  @IsString()
  specialDiet?: string;
}