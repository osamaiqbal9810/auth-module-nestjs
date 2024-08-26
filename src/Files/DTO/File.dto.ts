import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsNumber, IsString } from "class-validator";


export class FileDto {
    @ApiProperty()
    @IsString()
    @IsNotEmpty()
    id: string

    @ApiProperty()
    @IsString()
    @IsNotEmpty()
    originalName: string

    @ApiProperty()
    @IsString()
    @IsNotEmpty()
    fileName: string


    @ApiProperty()
    @IsString()
    @IsNotEmpty()
    path: string

    @ApiProperty()
    @IsString()
    @IsNotEmpty()
    userId: string

    @ApiProperty()
    @IsNumber()
    @IsNotEmpty()
    fileSize: number
}