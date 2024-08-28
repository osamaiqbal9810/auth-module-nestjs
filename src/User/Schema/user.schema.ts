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
    @IsArray()
    @IsNotEmpty()
    roles: String[]
    
    @ApiProperty()
    @IsArray()
    @IsNotEmpty()
    subscriptionPlan: String

    @ApiProperty()
    @IsBoolean()
    isRemoved: Boolean = false

    constructor(
        id: String,
        name: String,
        email: String,
        roles: String[] = [Role[Role.User]],
        subscriptionPlan: String = SubscriptionPlan[SubscriptionPlan.Basic],
        isRemoved?: Boolean
      ) {
        this.id = id;
        this.name = name;
        this.email = email;
        this.roles = roles;
        this.subscriptionPlan = subscriptionPlan
        if (isRemoved !== undefined) {
          this.isRemoved = isRemoved;
        }
      }
}