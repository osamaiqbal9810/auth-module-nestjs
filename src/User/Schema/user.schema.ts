import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { IsDate, IsEmail, IsNotEmpty, IsString, IsStrongPassword } from "class-validator";
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
    @Prop({ unique: true })
    email: String
    
    @IsString()
    @IsNotEmpty()
    @IsStrongPassword()
    @Prop()
    hashedPassword: String
    
    @IsString()
    @Prop()
    resetToken: String

    @IsDate()
    @Prop()
    tokenExpiryDate: Date
}

export const UserSchema = SchemaFactory.createForClass(User)