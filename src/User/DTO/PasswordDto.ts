import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsString } from "class-validator";

export class PasswordDto {
    @IsString()
    @ApiProperty()
    @IsNotEmpty()
    email: string
    
  }
  