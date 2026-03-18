import { IsString, IsOptional } from 'class-validator';

export class PropertyDto {

  @IsString()
  noticeType: string; // sell or rent

  @IsOptional()
  @IsString()
  propertyType?: string;

  // Sell fields
  @IsOptional()
  @IsString()
  bhk?: string;

  @IsOptional()
  @IsString()
  builtUpArea?: string;

  @IsOptional()
  @IsString()
  bathrooms?: string;

  @IsOptional()
  @IsString()
  floor?: string;

  @IsOptional()
  @IsString()
  propertyAge?: string;

  @IsOptional()
  @IsString()
  furnishing?: string;

  @IsOptional()
  @IsString()
  condition?: string; // parking yes/no

  @IsOptional()
  @IsString()
  facingSide?: string;

  @IsOptional()
  @IsString()
  price?: string;

  // Rent fields
  @IsOptional()
  @IsString()
  monthlyRentAmount?: string;

  @IsOptional()
  @IsString()
  securityDeposit?: string;

  @IsOptional()
  @IsString()
  maintenanceAmount?: string;

  @IsOptional()
  @IsString()
  availableFrom?: string;

  @IsOptional()
  @IsString()
  tenantType?: string;

  @IsOptional()
  @IsString()
  leaseDuration?: string;
}