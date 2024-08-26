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
    fileSize: Number

    constructor(
        id: string = "",
        originalName: string = "",
        fileName: string = "",
        path: string = "",
        userId: string = "",
        fileSize: Number = 0
      ) {
        this.id = id;
        this.originalName = originalName;
        this.fileName = fileName;
        this.path = path;
        this.userId = userId;
        this.fileSize = fileSize;
      }
}