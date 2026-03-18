import { IsString, IsOptional, IsObject } from 'class-validator';

export class PublicNoticeDto {

    @IsOptional()
    @IsString()
    noticetype?: string;

    @IsOptional()
    @IsString()
    issuingAuthority?: string;

    @IsOptional()
    @IsString()
    referenceNumber?: string;

    @IsOptional()
    @IsString()
    publishDate?: string;

    @IsOptional()
    @IsString()
    expiryDate?: string;

    @IsOptional()
    @IsString()
    detailedNotice?: string;

    @IsOptional()
    @IsObject()
    pdf?: {
        name?: string;
        uri?: string;
        size?: number;
        mimeType?: string;
    };

}