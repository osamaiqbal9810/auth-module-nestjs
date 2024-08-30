import { ApiProperty } from "@nestjs/swagger";
import { IsEmail, IsString } from "class-validator";

export class VerificationCodeDto {
    @ApiProperty()
    @IsString()
    @IsEmail()
    email: String

    @ApiProperty()
    @IsString()
    verificationCode: String

    constructor(email: String, verificationCode: String) {
        this.email = email
        this.verificationCode = verificationCode
    }
}