import { ApiProperty } from "@nestjs/swagger";
import { IsArray } from "class-validator";

export class UpdateFileTagsDto {
    @ApiProperty()
    @IsArray()
    fileTags: string[]

    constructor(fileTags?: UpdateFileTagsDto) {
        this.fileTags = fileTags?.fileTags ?? [] 
    }
}