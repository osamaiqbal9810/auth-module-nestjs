import {IsArray, IsEmail, IsNotEmpty, IsString } from "class-validator";
import { Role } from "../Roles/Role.enum";

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

    @IsArray()
    @IsNotEmpty()
    roles: String[]
}