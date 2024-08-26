import { ApiProperty } from "@nestjs/swagger";
import { IsArray, IsBoolean, IsEmail, IsNotEmpty, IsString } from "class-validator";

export class User {

    @ApiProperty()
    @IsString()
    @IsNotEmpty()
    id: String

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
    @IsArray()
    @IsNotEmpty()
    roles: String[]

    @IsBoolean()
    isRemoved: Boolean = false
}

export class CreatedUserDto extends User {}