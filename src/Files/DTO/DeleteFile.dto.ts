import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmptyObject, IsString } from "class-validator";

export class DeleteFileDto {
    @IsString()
    @IsNotEmptyObject()
    @ApiProperty()
    fileId: string

    constructor(fileId: string) {
        this.fileId = fileId
    }
}