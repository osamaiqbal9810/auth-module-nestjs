import { IsArray, IsBoolean, IsEmail, IsNotEmpty, IsString } from "class-validator";
import { Role } from "../enums/Role.enum";
import { SubscriptionPlan } from "../enums/SubscriptionPlan.enum";
import { ApiProperty } from "@nestjs/swagger";

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
    @IsBoolean()
    isRemoved: Boolean = false

    @ApiProperty()
    @IsBoolean()
    isVerified: Boolean = false

    @ApiProperty()
    @IsString()
    source: String

    @ApiProperty()
    @IsArray()
    @IsNotEmpty()
    roles: String[]
    
    @ApiProperty()
    @IsArray()
    @IsNotEmpty()
    subscriptionPlan: String

  

    constructor(
        id: String,
        name: String,
        email: String,
        isRemoved: Boolean = false,
        isVerified: Boolean = false,
        source: String = "in-app",
        roles: String[] = [Role[Role.User]],
        subscriptionPlan: String = SubscriptionPlan[SubscriptionPlan.Basic]
      ) {
        this.id = id;
        this.name = name;
        this.email = email;
        this.isRemoved = isRemoved;
        this.isVerified = isVerified
        this.source = source
        this.roles = roles;
        this.subscriptionPlan = subscriptionPlan
      }
}