import { IsString, IsOptional, IsArray, IsUrl } from 'class-validator';

export class BusinessDto {

  @IsString()
  businessName: string;

  @IsOptional()
  @IsString()
  businessType?: string;

  @IsOptional()
  @IsString()
  serviceOffered?: string;

  @IsOptional()
  @IsString()
  gstNumber?: string;

  @IsOptional()
  @IsUrl()
  websiteUrl?: string;

  @IsOptional()
  @IsArray()
  @IsUrl({}, { each: true })
  socialMediaLinks?: string[];

  @IsOptional()
  @IsString()
  campaignName?: string;

  @IsOptional()
  @IsString()
  validTill?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  shopAddress?: string;
}