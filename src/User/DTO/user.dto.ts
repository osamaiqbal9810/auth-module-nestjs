import { ApiProperty } from "@nestjs/swagger";
import { IsEmail, IsNotEmpty, IsString } from "class-validator";

export class UserDto {
    @ApiProperty()
    @IsString()
    @IsNotEmpty()
     name: String

    @ApiProperty()
    @IsString()
    @IsNotEmpty()
    @IsEmail()
    email: String

    @ApiProperty()
    @IsString()
    password: String
}
