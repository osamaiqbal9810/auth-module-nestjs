import {IsEmail, IsNotEmpty, IsString } from "class-validator";

export class User {

    @IsString()
    @IsNotEmpty()
    id: String

    @IsString()
    @IsNotEmpty()
    name: String

    @IsString()
    @IsNotEmpty()
    @IsEmail()

    email: String
}