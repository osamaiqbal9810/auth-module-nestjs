import { ApiProperty } from "@nestjs/swagger";
import { IsEmail, IsString } from "class-validator";

export class VerifyInAppUserDto {
    @ApiProperty()
    @IsString()
    @IsEmail()
    email: string

    constructor(email: string) {
        this.email = email
    }
}