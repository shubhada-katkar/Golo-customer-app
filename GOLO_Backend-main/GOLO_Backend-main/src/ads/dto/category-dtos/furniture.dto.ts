import { IsString, IsNumber, IsOptional, IsBoolean, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class FurnitureDto {

  @IsString()
  furnitureType: string;

  @IsString()
  material: string;

  @IsOptional()
  @IsString()
  size?: string;

  @IsOptional()
  @IsString()
  condition?: string;

  @IsOptional()
  @IsBoolean()
  negotiable?: boolean;

  @IsNumber()
  @Min(0)
  @Type(() => Number)
  price: number;

}