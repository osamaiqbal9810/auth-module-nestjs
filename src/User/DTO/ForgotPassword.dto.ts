import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsString } from "class-validator";

export class ForgotPasswordDto {
    @IsString()
    @ApiProperty()
    @IsNotEmpty()
    email: string
   
    constructor(email: string) {
      this.email = email
    }
  }
  