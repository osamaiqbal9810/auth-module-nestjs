import { BadRequestException, forwardRef, Inject, Injectable, InternalServerErrorException } from '@nestjs/common';
import { UserDto } from 'src/User/DTO/user.dto';
import { User } from 'src/User/Schema/user.schema';
import * as bcrypt from 'bcrypt';
import { PrismaService } from 'src/prisma.service';
import { Role } from 'src/User/enums/Role.enum';
import { PasswordResetDto } from 'src/Auth/DTO/SignInDto';
import { SubscriptionPlan } from 'src/User/enums/SubscriptionPlan.enum';
import { AuthService } from 'src/Auth/Service/auth.service';
import { users } from '@prisma/client';
import { validateOrReject } from 'class-validator';



@Injectable()
export class UserService {
    constructor(private prismaService: PrismaService, @Inject(forwardRef(() => AuthService)) private authService: AuthService) { }

    async createUser(dto: UserDto): Promise<User> {
        await validateOrReject(dto);
        const existingUser = await this.findOneByEmail(dto.email)
        if (existingUser) {
            throw new BadRequestException("User with same email address already exist")
        }
        const result = await this.prismaService.$transaction(async (prisma) => {
            const user = await prisma.users.create({
                data: {
                    name: dto.name.toString(),
                    email: dto.email.toLowerCase().toString(),
                    roles: [Role[Role.User]],
                    subscriptionPlan: SubscriptionPlan[SubscriptionPlan.Basic]
                },
            });
            let salt = await bcrypt.genSalt()
            let hashedPassword = await bcrypt.hash(dto.password.toString(), salt)
            // Step 2: Create the password entry for the user
             await prisma.userspasswords.create({
                data: {
                    hashedPassword: hashedPassword,
                    userId: user.id,
                },
            });
            return user 
        })
        return result
    }


    async findOneByEmail(email: String): Promise<User | null> {
        return this.find(async () => await this.prismaService.users.findFirst({ where: { email: email.toString(), isRemoved: false } }))
    }

    async findOneById(id: String): Promise<User | null> {
        return this.find(async () => await this.prismaService.users.findFirst({ where: { id: id.toString(), isRemoved: false } }))
    }

    async find(userRecord: () => Promise<User | null>): Promise<User | null> {
        const user = await userRecord()
        if (!user) {
            return null
        }
        let userObj = new User(
            user.id,
            user.name,
            user.email,
            user.roles, 
            user.isRemoved
        );
        return userObj

    }

    async deleteUser(email: string): Promise<User> {
        return await this.prismaService.users.update({
            where: { email: email },
            data: { isRemoved: true }
        })
    }

    async deleteUserById(id: string): Promise<User> {
        return await this.prismaService.users.update({
            where: { id: id },
            data: { isRemoved: true }
        })
    }

    async resetPassword(token: String, passwordDto: PasswordResetDto): Promise<void> {
        const user = await this.getUserByEmailAndResetToken(passwordDto.email.toLowerCase(), token)
        const salt = await bcrypt.genSalt()
        const hashedPassword = await bcrypt.hash(passwordDto.newPassword, salt)
        const updatedPassword = await this.prismaService.userspasswords.update({
            where: { userId: user.id.toString() },
            data: { hashedPassword: hashedPassword, resetToken: "", tokenExpiryDate: null }
        })

        if (!updatedPassword) {
            throw new InternalServerErrorException()
        }
    }

    async getUserByEmailAndResetToken(email: String, token: String): Promise<User> {
        let userObj = await this.prismaService.userspasswords.findFirst({
            where: { resetToken: token.toString(), user: { email: email.toString()} },
            include: { user: true },
        });
        if (!userObj || !userObj.user) {
            throw new BadRequestException("User with this email and valid token doesn't exist")
        }

        if (userObj.tokenExpiryDate && userObj.tokenExpiryDate < new Date()) {
            // invalidate reset token by deleting it from database
            await this.prismaService.userspasswords.update({
                where: { userId: userObj.user.id.toString() },
                data: { resetToken: "" }
            })
            throw new BadRequestException("Reset token got expired. Please try again.")
        }
        return userObj.user
    }

    async saveResetTokenAndExpiry(userId: String, token: String, tokenExpiryDate: Date): Promise<boolean> {
        let result = await this.prismaService.userspasswords.update({
            where: { userId: userId.toString() },
            data: { resetToken: token.toString(), tokenExpiryDate: new Date(tokenExpiryDate) }
        })

        return result ? true : false
    }


    // google log in
    async createGmailUser(dto: UserDto): Promise<{ access_token: String, user: users }> {
        let existingUser = await this.findOneByEmail(dto.email)
        if (!existingUser) {
            const user = await this.prismaService.users.create({
                data: {
                    name: dto.name.toString(),
                    email: dto.email.toLowerCase().toString(),
                    roles: [Role[Role.User]],
                    subscriptionPlan: SubscriptionPlan[SubscriptionPlan.Basic],
                },
            });
            const payload = { _id: user.id.toString(), roles: user.roles }
            return { access_token: await this.authService.generateJWT(payload), user: user }
        }
        else {
            const payload = { _id: existingUser.id, roles: existingUser.roles }
            return { access_token: await this.authService.generateJWT(payload), user: existingUser as users }
        }

    }

}
