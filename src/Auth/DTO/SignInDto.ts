import { ApiProperty } from "@nestjs/swagger";
import { IsEmail, IsString, IsStrongPassword } from "class-validator";


export class SignInDto {
    @ApiProperty()
    @IsString()
    @IsEmail()
    email: string

    @ApiProperty()
    @IsString()
    password: string

    constructor(email: string, password: string) {
        this.email = email;
        this.password = password;
      }
}

export class PasswordResetDto {

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