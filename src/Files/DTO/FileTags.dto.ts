import { ApiProperty } from "@nestjs/swagger";
import { IsArray } from "class-validator";

export class FileTagsDto {
    @ApiProperty()
    @IsArray()
    fileTags: string[]

    constructor(fileTags?: FileTagsDto) {
        this.fileTags = fileTags?.fileTags ?? [] 
    }
}