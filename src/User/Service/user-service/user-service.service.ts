import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { UserDto } from 'src/User/DTO/user.dto';
import { User } from 'src/User/Schema/user.schema';
import { validateOrReject } from 'class-validator'
import * as bcrypt from 'bcrypt';
import { PasswordDto } from 'src/User/DTO/PasswordDto';

@Injectable()
export class UserService {

    constructor(@InjectModel('User') private UserModel: Model<User>) { }

    async createUser(dto: UserDto): Promise<User> {
        await validateOrReject(dto);
        let salt = await bcrypt.genSalt()
        let hash = await bcrypt.hash(dto.password.toString(), salt)
        const newUser = await new this.UserModel()
        newUser.name = dto.name
        newUser.email = dto.email
        newUser.hashedPassword = hash

        return newUser.save()
    }

    async findOne(email: String): Promise<User | undefined> {
        const existingUser = await this.UserModel.findOne({ email: email })
        if (existingUser != null) {
            return new this.UserModel({ name: existingUser.name, email: existingUser.email, hashedPassword: existingUser.hashedPassword })
        } else {
            return null
        }
    }

    async deleteUser(email: string): Promise<number> {
        const deletedUser = await this.UserModel.deleteOne({ email: email })
        return deletedUser.deletedCount
    }

    async resetPassword(token: string, newPassword: string): Promise<User> {
        const user = await this.getUserByResetToken(token)
        if (user != null) {
            const salt = await bcrypt.genSalt()
            const hashedPassword = await bcrypt.hash(newPassword, salt)
            return await this.UserModel.findOneAndUpdate({_id: user._id}, {hashedPassword: hashedPassword, resetToken: "", tokenExpiryDate: ""}, {new: true})
        }
        return null
    }

    async getUser(email: string): Promise<User> {
        return await this.UserModel.findOne({ email: email })
    }

    async getUserByResetToken(token: string): Promise<User> {
        return this.UserModel.findOne({resetToken: token, tokenExpiryDate: {$gt: new Date()}})
    }
    async saveResetTokenAndExpiry(user: User, token: string, tokenExpiryDate: Date): Promise<void> {
        await this.UserModel.findOneAndUpdate({email: user.email}, {resetToken: token, tokenExpiryDate: tokenExpiryDate}, {upsert: true, new: true})
    }
}
