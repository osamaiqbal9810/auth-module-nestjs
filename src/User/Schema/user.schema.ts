import { IsArray, IsBoolean, IsEmail, IsNotEmpty, IsString } from "class-validator";
import { Role } from "../enums/Role.enum";
import { SubscriptionPlan } from "../enums/SubscriptionPlan.enum";

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
    
    @IsArray()
    @IsNotEmpty()
    subscriptionPlan: String

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