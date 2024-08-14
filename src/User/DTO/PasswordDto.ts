import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsString, IsStrongPassword } from "class-validator";

export class PasswordDto {
    @IsString()
    @ApiProperty()
    @IsNotEmpty()
    email: string
    
  }
  