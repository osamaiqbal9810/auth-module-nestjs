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

    constructor(
        id: String,
        name: String,
        email: String,
        roles: String[],
        isRemoved?: Boolean
      ) {
        this.id = id;
        this.name = name;
        this.email = email;
        this.roles = roles;
        if (isRemoved !== undefined) {
          this.isRemoved = isRemoved;
        }
      }
}