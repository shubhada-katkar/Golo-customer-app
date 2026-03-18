import { IsString, IsOptional } from 'class-validator';

export class OthersDto {

    @IsOptional()
    @IsString()
    title?: string;

    @IsOptional()
    @IsString()
    description?: string;

    @IsOptional()
    @IsString()
    price?: string;

}