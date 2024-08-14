import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { IsEmail, IsNotEmpty, IsString, IsStrongPassword } from "class-validator";
import { Document } from 'mongoose';
@Schema()
export class User extends Document {
    @IsString()
    @IsNotEmpty()
    @Prop()
    name: String

    @IsString()
    @IsNotEmpty()
    @IsEmail()
    @Prop()
    email: String
    
    @IsString()
    @IsNotEmpty()
    @IsStrongPassword()
    @Prop()
    hashedPassword: String
    
    @IsString()
    @Prop()
    resetToken: String
}

export const UserSchema = SchemaFactory.createForClass(User)