import { ApiProperty } from "@nestjs/swagger";
import { IsEmail, IsNotEmpty, IsString } from "class-validator";

export class UserSignUpDto {
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

    constructor(name: string = "", email: string = "", password: string = "") {
        this.name = name;
        this.email = email;
        this.password = password;
      }
}
