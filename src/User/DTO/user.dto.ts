import { ApiProperty } from "@nestjs/swagger";
import { IsEmail, IsNotEmpty, IsString, IsStrongPassword } from "class-validator";
import { Role } from "../enums/Role.enum";
import { SubscriptionPlan } from "../enums/SubscriptionPlan.enum";

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

    @ApiProperty()
    @IsNotEmpty()
    roles: Role[]
    subscriptionPlan: any;
}
