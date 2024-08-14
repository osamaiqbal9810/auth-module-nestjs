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

    // async sendForgotPasswordEmail(email: string) {
    //     const message = `Forgot your password? If you didn't forget your password, please ignore this email!.`;

    //     this.mailService.sendMail({
    //       from: 'osamaiqbalcs@gmail.com',
    //       to: 'osamaiqbalcs@gmail.com',
    //       subject: `Forgot Password`,
    //       template: "./EmailTempalte",
    //       text: message,
    //     });
    // }

    // async forgotPassword(passwordDto: PasswordDto): Promise<User | null> {
    //     let existingUser = await this.findOne(passwordDto.email)
    //     if (existingUser) {
    //         let salt = await bcrypt.genSalt()
    //         let hash = await bcrypt.hash(passwordDto.password.toString(), salt)
    //         const updatedUser = await this.UserModel.findOneAndUpdate({email: passwordDto.email}, {hashedPassword: hash}, {new: true})
    //        return updatedUser
    //     }
    //     return null
    // }


    async getUser(email: string): Promise<User> {
        return await this.UserModel.findOne({ email: email })
    }

    async saveResetToken(user: User, token: string) {
        return await this.UserModel.findOneAndUpdate({email: user.email}, {resetToken: token}, {upsert: true, new: true})
    }
}
