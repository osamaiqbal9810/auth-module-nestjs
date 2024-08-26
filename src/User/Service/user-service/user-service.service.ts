import { forwardRef, Inject, Injectable } from '@nestjs/common';
import { UserDto } from 'src/User/DTO/user.dto';
import { User } from 'src/User/Schema/user.schema';
import { validateOrReject } from 'class-validator'
import * as bcrypt from 'bcrypt';
import { PrismaService } from 'src/prisma.service';
import { Role } from 'src/User/enums/Role.enum';
import { PasswordResetDto } from 'src/Auth/DTO/SignInDto';
import { SubscriptionPlan } from 'src/User/enums/SubscriptionPlan.enum';
import { AuthService } from 'src/Auth/Service/auth.service';


@Injectable()
export class UserService {
    constructor(private prismaService: PrismaService,  @Inject(forwardRef(() => AuthService)) private authService: AuthService) { }

    async createUser(dto: UserDto): Promise<User> {
       // await validateOrReject(dto);
       
        const result = await this.prismaService.$transaction(async (prisma) => {
            const user = await prisma.users.create({
                data: {
                    name: dto.name.toString(),
                    email: dto.email.toLowerCase().toString(),
                    roles: dto.roles.map((role) => {
                        if (!Object.values(Role).includes(role)) {
                            throw new Error(`Invalid Role value`) // if invalid role is provided then stop user creation
                        }
                        return role.toString()
                    }),
                    subscriptionPlan: SubscriptionPlan[SubscriptionPlan.Basic]
                },
            });
            let salt = await bcrypt.genSalt()
            let hashedPassword = await bcrypt.hash(dto.password.toString(), salt)
            // Step 2: Create the password entry for the user
            await prisma.userspasswords.create({
                data: {
                    hashedPassword:  hashedPassword,
                    userId: user.id,
                },
            });
            return user
        })
        return result
    }


    async findOneByEmail(email: String): Promise<User> {
        return this.find(async () => await this.prismaService.users.findFirst({ where: { email: email.toString(), isRemoved: false } }))
    }

    async findOneById(id: String): Promise<User> {
        return this.find(async () => await this.prismaService.users.findFirst({ where: { id: id.toString(), isRemoved: false } }))
    }

    async find(userRecord: () => Promise<User>): Promise<User> {
        const user = await userRecord()
        if (!user) {
            return null
        }
        let userObj = new User()
        userObj.id = user.id
        userObj.name = user.name
        userObj.email = user.email
        userObj.roles = user.roles // TODO convert to Role
        return userObj

    }

    async deleteUser(email: string): Promise<User> {
        return await this.prismaService.users.update({
            where: {email: email},
            data: {isRemoved: true}
        })
    }

    async deleteUserById(id: string): Promise<User> {
        return await this.prismaService.users.update({ 
            where: { id: id },
            data: {isRemoved: true} 
        })
    }

    async resetPassword(token: string, passwordDto: PasswordResetDto): Promise<boolean> {
        const user = await this.getUserByEmailAndResetToken(passwordDto.email.toLowerCase(), token)
        if (!user) {
            return false
        }
        const salt = await bcrypt.genSalt()
        const hashedPassword = await bcrypt.hash(passwordDto.newPassword, salt)
        const updatedPassword = await this.prismaService.userspasswords.update({
            where: { userId: user.id.toString() },
            data: { hashedPassword: hashedPassword, resetToken: "", tokenExpiryDate: "" }
        })
        return updatedPassword ? true : false
    }

    async getUserByEmailAndResetToken(email: string, token: string): Promise<User> {
        let userObj = await this.prismaService.userspasswords.findFirst({
            where: { resetToken: token, user: { email: email } },
            include: { user: true },
        });

        if (userObj) {
            return userObj.user
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


    // google log in

    async createGmailUser(dto: UserDto): Promise<{access_token: string}> {
        let existingUser = await  this.findOneByEmail(dto.email)
        if (!existingUser) {
        const user = await this.prismaService.users.create({
            data: {
              name: dto.name.toString(),
              email: dto.email.toLowerCase().toString(),
              roles: dto.roles.map((role) => {
                if (!Object.values(Role).includes(role)) {
                  throw new Error(`Invalid Role value`);
                }
                return role.toString();
              }),
              subscriptionPlan: (() => {
                const plan = dto.subscriptionPlan.toString();
                if (Object.values(SubscriptionPlan).includes(plan)) {
                  return SubscriptionPlan[dto.subscriptionPlan];
                }
                throw new Error(`Invalid Subscription plan value`);
              })(),
            },
          });
          const payload = { _id: user.id }
         return { access_token: await this.authService.generateJWT(payload)  }
        }
        else {
            const payload = { _id: existingUser.id }
            return { access_token: await this.authService.generateJWT(payload)  }
        }
         
    }

}
