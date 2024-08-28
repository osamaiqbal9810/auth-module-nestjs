import { ApiProperty } from "@nestjs/swagger";
import { IsEmail, IsString, IsStrongPassword } from "class-validator";

export class ResetPasswordDto {

    @ApiProperty()
    @IsEmail()
    email: string
    
    @ApiProperty()
    @IsString()
    @IsStrongPassword()
    newPassword: string

    constructor(email: string, newPassword: string) {
        this.email = email;
        this.newPassword = newPassword;
      }
}