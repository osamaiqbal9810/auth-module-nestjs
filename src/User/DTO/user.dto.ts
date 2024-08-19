import { ApiProperty } from "@nestjs/swagger";
import { IsEmail, IsNotEmpty, IsString, IsStrongPassword } from "class-validator";
import { Role } from "../Roles/Role.enum";


export class UserDto {
    @ApiProperty()
    @IsString()
    @IsNotEmpty()
    readonly name: String

    @ApiProperty()
    @IsString()
    @IsNotEmpty()
    @IsEmail()
    readonly email: String

    @ApiProperty()
    @IsString()
     @IsNotEmpty()
    @IsStrongPassword()
    readonly password: String

    @ApiProperty()
    @IsNotEmpty()
    readonly roles: String[]
}