import { ApiProperty } from "@nestjs/swagger";
import { IsEmail, IsString } from "class-validator";


export class UserSignInDto {
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
