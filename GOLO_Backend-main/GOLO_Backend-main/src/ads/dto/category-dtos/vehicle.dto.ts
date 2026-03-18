import { IsEnum, IsString, IsNumber, IsOptional } from 'class-validator';
import { Type } from 'class-transformer';

export class VehicleDto {

  @IsEnum(['Rent', 'Sell'])
  type: string;

  @IsOptional()
  @IsString()
  vehicleType?: string;

  @IsOptional()
  @IsString()
  vehicleType2?: string;

  @IsOptional()
  @IsString()
  brand?: string;

  @IsOptional()
  @IsString()
  brand2?: string;

  @IsOptional()
  @IsString()
  model?: string;

  @IsOptional()
  @IsString()
  variant?: string;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  year?: number;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  kilometersDriven?: number;

  @IsOptional()
  @IsString()
  fuelType?: string;

  @IsOptional()
  @IsEnum(['Manual', 'Automatic'])
  transmission?: string;

  @IsOptional()
  @IsString()
  ownership?: string;

  @IsOptional()
  @IsString()
  insurance?: string;

  @IsOptional()
  @IsString()
  condition?: string;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  price?: number;

  // Rent fields

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  perDayRentAmount?: number;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  securityDeposit?: number;

  @IsOptional()
  @IsEnum(['yes', 'no', 'both'])
  includesDriver?: string;

  @IsOptional()
  @IsString()
  minRentalDuration?: string;
}