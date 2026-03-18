import { IsString, IsOptional, IsBoolean } from 'class-validator';

export class ElectronicsDto {

  @IsString()
  electronicsType: string;

  @IsOptional()
  @IsString()
  brand?: string;

  @IsOptional()
  @IsString()
  modelNumber?: string;

  @IsOptional()
  @IsString()
  warrantyRemaining?: string;

  @IsOptional()
  @IsString()
  capacity?: string;

  @IsOptional()
  @IsString()
  condition?: string;

  @IsOptional()
  @IsBoolean()
  negotiable?: boolean;

  @IsString()
  price: string;
}