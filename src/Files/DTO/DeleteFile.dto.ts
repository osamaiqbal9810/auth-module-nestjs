import { ApiProperty } from "@nestjs/swagger";
import {IsString } from "class-validator";

export class DeleteFileDto {
    @IsString()
    @ApiProperty()
    fileId: string

    constructor(fileId: string) {
        this.fileId = fileId
    }
}