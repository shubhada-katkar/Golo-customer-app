import { IsEnum, IsString, IsOptional, IsDateString } from 'class-validator';

export class LostFoundDto {

  @IsEnum(['lost', 'found'])
  condition: string;

  @IsString()
  itemName: string;

  @IsString()
  itemType: string;

  @IsDateString()
  date: string;

  @IsString()
  location: string;

  @IsString()
  description: string;

  @IsOptional()
  @IsString()
  reward?: string;

  @IsString()
  contactDetails: string;
}