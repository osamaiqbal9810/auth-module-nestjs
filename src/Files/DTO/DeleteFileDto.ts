import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmptyObject, IsString } from "class-validator";

export class DeleteFileDto {
    @IsString()
    @IsNotEmptyObject()
    @ApiProperty()
    fileId: string
}