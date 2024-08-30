import { ApiProperty } from "@nestjs/swagger"
import { IsString, IsEmail } from "class-validator"

export class ResendVerificationCodeDto {
    @ApiProperty()
    @IsString()
    @IsEmail()
    email: string

    constructor(email: string) {
        this.email = email
    }
}