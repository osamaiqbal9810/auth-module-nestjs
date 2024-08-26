
import { IsDate, IsNotEmpty, IsString, IsStrongPassword } from "class-validator";

export class UsersPassword {

    @IsString()
    userId: String

    @IsString()
    @IsStrongPassword()
    @IsNotEmpty()
    hashedPassword: String

    @IsString()
    resetToken: String

    @IsDate()
    tokenExpiryDate: Date

    constructor(
        userId: string,
        hashedPassword: string,
        resetToken: string,
        tokenExpiryDate: Date
      ) {
        this.userId = userId;
        this.hashedPassword = hashedPassword;
        this.resetToken = resetToken;
        this.tokenExpiryDate = tokenExpiryDate;
      }
}
