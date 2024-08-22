import { IsNotEmpty, IsNumber, IsString } from "class-validator";

export class FileDto {
    @IsString()
    @IsNotEmpty()
    id: string

    @IsString()
    @IsNotEmpty()
    originalName: string

    @IsString()
    @IsNotEmpty()
    fileName: string


    @IsString()
    @IsNotEmpty()
    path: string

    @IsString()
    @IsNotEmpty()
    userId: string

    @IsNumber()
    @IsNotEmpty()
    fileSize: Number
}