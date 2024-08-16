import { Injectable, OnModuleInit } from '@nestjs/common';
import { UserDto } from 'src/User/DTO/user.dto';
import { User } from 'src/User/Schema/user.schema';
import { validateOrReject } from 'class-validator'
import * as bcrypt from 'bcrypt';
import { PrismaService } from 'src/prisma.service';


@Injectable()
export class UserService {
    constructor(private prismaService: PrismaService) { }

    async createUser(dto: UserDto): Promise<User> {
        await validateOrReject(dto);
        let salt = await bcrypt.genSalt()
        let hashedPassword = await bcrypt.hash(dto.password.toString(), salt)
        const user = await this.prismaService.users.create({
            data: {
                name: dto.name.toString(),
                email: dto.email.toString(),
            }
        })

        const password = await this.prismaService.userspasswords.create({
            data: {
                hashedPassword: hashedPassword,
                userId: user.id
            }
        })
        return user && password ? user : null
    }

    async findOne(email: String): Promise<User> {
        const existingUser = await this.prismaService.users.findFirst({ where: { email: email } })
        if (existingUser) {
            let user = new User()
            user.id = existingUser.id
            user.name = existingUser.name
            user.email = existingUser.email
            return user
        }
        return null
    }

    async findOneById(id: String): Promise<User> {
        const existingUser = await this.prismaService.users.findFirst({ where: { id: id.toString() } })
        if (existingUser) {
            let user = new User()
            user.name = existingUser.name
            user.email = existingUser.email
            return user
        }
        return null
    }

    async deleteUser(email: string): Promise<User> {
        return await this.prismaService.users.delete({ where: { email: email } })
    }

    async deleteUserById(id: string): Promise<User> {
        return await this.prismaService.users.delete({ where: { id: id } })
    }

    async resetPassword(token: string, newPassword: string): Promise<boolean> {
        const user = await this.getUserByResetToken(token)
        if (user) {
            const salt = await bcrypt.genSalt()
            const hashedPassword = await bcrypt.hash(newPassword, salt)
            const updatedPassword = await this.prismaService.userspasswords.update({
                where: { userId: user.id.toString() },
                data: { hashedPassword: hashedPassword, resetToken: "", tokenExpiryDate: "" }
            })
        
            return updatedPassword ? true : false
        }
        return false
    }

    async getUserByResetToken(token: string): Promise<User> {
        let user = await this.prismaService.userspasswords.findFirst({
            where: { resetToken: token },
            include: { user: true }
        });

        if (user) {
            return user.user
        }
        return null
    }

    async saveResetTokenAndExpiry(userId: string, token: string, tokenExpiryDate: Date): Promise<boolean> {
        let result = await this.prismaService.userspasswords.update({
            where: { userId: userId },
            data: { resetToken: token, tokenExpiryDate: tokenExpiryDate }
        })
        return result ? true : false
    }

}
