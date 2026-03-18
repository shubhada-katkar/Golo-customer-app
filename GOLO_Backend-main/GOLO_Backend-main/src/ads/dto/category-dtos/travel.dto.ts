import { IsString, IsOptional } from 'class-validator';

export class TravelDto {

  @IsString()
  courseType: string; // tour package, cab service, etc.

  @IsOptional()
  @IsString()
  destination?: string;

  @IsOptional()
  @IsString()
  duration?: string;

  @IsOptional()
  @IsString()
  travelDate?: string;

  @IsOptional()
  @IsString()
  price?: string;

  @IsOptional()
  @IsString()
  availableSeats?: string;

  @IsOptional()
  @IsString()
  pickupLocation?: string;

  @IsOptional()
  @IsString()
  inclusions?: string;

  @IsOptional()
  @IsString()
  exclusions?: string;
}