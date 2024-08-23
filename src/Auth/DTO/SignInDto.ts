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
}

export class PasswordResetDto {

    @ApiProperty()
    @IsEmail()
    email: string
    
    @ApiProperty()
    @IsString()
    @IsStrongPassword()
    newPassword: string
}