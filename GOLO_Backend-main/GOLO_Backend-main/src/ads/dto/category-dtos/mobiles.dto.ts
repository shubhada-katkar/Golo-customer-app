import { IsEnum, IsString, IsNumber, IsOptional, IsBoolean, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class MobileDto {

  @IsString()
  brand: string;

  @IsString()
  model: string;

  @IsEnum(['new', 'like new', 'fair'])
  condition: string;

  @IsOptional()
  @IsString()
  warranty?: string;

  @IsNumber()
  @Min(0)
  @Type(() => Number)
  price: number;

  @IsOptional()
  @IsBoolean()
  negotiable?: boolean;
}