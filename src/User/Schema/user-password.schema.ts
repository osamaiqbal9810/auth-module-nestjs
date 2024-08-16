
import { IsDate, IsNotEmpty, IsString, IsStrongPassword } from "class-validator";

export class UsersPassword {

    @IsString()
    userId: String

    @IsString()
    @IsStrongPassword()
    hashedPassword: String

    @IsString()
    resetToken: String

    @IsDate()
    tokenExpiryDate: Date
}
