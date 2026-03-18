import { IsOptional, IsString } from 'class-validator';

export class GreetingsDto {

    @IsOptional()
    @IsString()
    noticeType?: string; // greetings | tribute


    // Greetings fields
    @IsOptional()
    @IsString()
    relationType?: string;

    @IsOptional()
    @IsString()
    name?: string;

    @IsOptional()
    @IsString()
    age?: string;

    @IsOptional()
    @IsString()
    year?: string;

    @IsOptional()
    @IsString()
    wishes?: string;

    @IsOptional()
    @IsString()
    from?: string;


    // Tribute fields
    @IsOptional()
    @IsString()
    name2?: string;

    @IsOptional()
    @IsString()
    age2?: string;

    @IsOptional()
    @IsString()
    year2?: string;

    @IsOptional()
    @IsString()
    summary?: string;

    @IsOptional()
    @IsString()
    funeralDetails?: string;

}