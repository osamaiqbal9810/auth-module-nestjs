import { BadRequestException, forwardRef, Inject, Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { UserSignUpDto } from 'src/User/DTO/UserSignUp.dto';
import { User } from 'src/User/Schema/user.schema';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../../../../prisma/prisma.service';
import { Role } from 'src/User/enums/Role.enum';

import { SubscriptionPlan } from 'src/User/enums/SubscriptionPlan.enum';
import { AuthService } from 'src/Auth/Service/auth.service';
import { Users } from '@prisma/client';
import { validateOrReject } from 'class-validator';
import { ResetPasswordDto } from 'src/Auth/DTO/ResetPassword.dto';
import { VerifyInAppUserDto } from 'src/Auth/DTO/VerifyEmail.dto';
import { MailerService } from '@nestjs-modules/mailer';
import { VerificationCodeDto } from 'src/User/DTO/VerificationCode.dto';



@Injectable()
export class UserService {
    constructor(private prismaService: PrismaService, @Inject(forwardRef(() => AuthService)) private authService: AuthService, private readonly mailService: MailerService) { }

    async verifyInAppUser(inAppUserDto: VerifyInAppUserDto): Promise<void> {
       let user = await this.prismaService.users.findFirst({
            where: {email: inAppUserDto.email, isRemoved: false}
        })

        if (!user) {
            throw new NotFoundException("User with this email doesn't exist")
        }
        if (!user.isVerified) {
            throw new BadRequestException("User email is not verified, please verify address and continue log in")
        }
        if (user.source == "google") {
            throw new BadRequestException(`This email is associated with some gmail based account. Continue using app through gmail login`)
        }
    }

    async createUser(dto: UserSignUpDto, serverUrl: String): Promise<User> {
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
             await prisma.userPasswords.create({
                data: {
                    hashedPassword: hashedPassword,
                    userId: user.id,
                },
            });
            return user 
        })
        // handle verification email
        let isEmailSent = await this.sendVerificationEmail(dto.email.toLowerCase().toString(), serverUrl)
        if (!isEmailSent) {
            throw new InternalServerErrorException()
        }
        return result
    }

    async sendVerificationEmail(email: String, serverUrl: String): Promise<boolean> {
        const verificationCode = Math.random().toString(36).substr(2, 8);
        const resetUrl = `${serverUrl}/auth/verify-email`;
        const expirationDate = new Date();
        expirationDate.setMinutes(expirationDate.getMinutes() + 5)
        // save verificationCode in db to validate at time when user verify email
         let isCodeSaved = await this.saveVerificationCode(email, verificationCode, expirationDate) 
         if (!isCodeSaved) {
             return false
         }
         
 
         this.mailService.sendMail({
           from: process.env.EMAIL_USERNAME,
           to: email.toString(),
           subject: `Verify Email address`,
           html: 
           `<!DOCTYPE html>
             <html>
             <head>
                 <meta charset="UTF-8">
                 <meta name="viewport" content="width=device-width, initial-scale=1.0">
             </head>
             <body style="font-family: Arial, sans-serif; margin: 0; padding: 0; background-color: #f4f4f4;">
                 <div style="width: 100%; padding: 20px; background-color: #ffffff; margin: 20px auto; max-width: 600px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);">
                     <h3 style="background-color: #4CAF50; color: white; padding: 10px; text-align: center; border-radius: 8px 8px 0 0;">Welcome to Our Service!</h3>
                     <div style="padding: 20px;">
                         <h1 style="margin: 0; font-size: 24px; color: #333333;">Hello</h1>
                         <p style="margin: 0; font-size: 16px; color: #555555;">Your sign up verification code is: <b>${verificationCode}</b>.Please click on link below to verify email</p>
                         
                         <a href="${resetUrl}">${resetUrl}</a>
                     </div>
                 </div>
 
             </body>
             </html>`
         });
         return true
    } 

    async validateVerificationCode(verificationCodeDto: VerificationCodeDto): Promise<void> {
        let user = await this.prismaService.users.findFirst({
            where: {
                email: verificationCodeDto.email.toString(),
                isRemoved: false,
                source: "in-app",
                isVerified: false
            }
        })

        if (!user) {
            throw new NotFoundException("user not found")
        }
        
        if (user.verificationExpiry && user.verificationExpiry < new Date()) {
            await this.prismaService.users.update({
                where: { id: user.id.toString() },
                data: { verificationCode: "" }
            })
            throw new BadRequestException("Verification code got expired. Please try again.")
        }

        if (user.verificationCode != verificationCodeDto.verificationCode) {
            throw new BadRequestException("Invalid verification code") 
        }
       let updateUser = await this.prismaService.users.update({
            where: {
                email: verificationCodeDto.email.toString(),
                isRemoved: false,
                source: "in-app",
                isVerified: false,
                verificationCode: user.verificationCode
            },
            data: {
                isVerified: true,
                verificationCode: ""
            }
        })
        
        if (!updateUser) {
            throw new InternalServerErrorException()
        }
    }

    async saveVerificationCode(email: String, verificationCode: String, expirationDate: Date): Promise<boolean> {
        let result = await this.prismaService.users.update({
            where: { email: email.toString() },
            data: { verificationCode: verificationCode.toString() ,verificationExpiry: new Date(expirationDate) }
        })
        if (!result) {
            throw new InternalServerErrorException()
        }
        return true
    }
    async findOneByEmail(email: String): Promise<User | null> {
        return this.find(async () => await this.prismaService.users.findFirst({ where: { email: email.toString(), isRemoved: false } }))
    }

    async findOneById(id: String): Promise<User | null> {
        return this.find(async () => await this.prismaService.users.findFirst({ where: { id: id.toString(), isRemoved: false } }))
    }

    async find(userRecord: () => Promise<Users | null>): Promise<User | null> {
        const user = await userRecord()
        if (!user) {
            return null
        }
        let userObj = new User(
            user.id,
            user.name,
            user.email,
            user.isRemoved,
            user.isVerified,
            user.source,
            user.roles,
            user.subscriptionPlan
        );
        return userObj as User

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

    async resetPassword(token: String, passwordDto: ResetPasswordDto): Promise<void> {
        const user = await this.getUserByEmailAndResetToken(passwordDto.email.toLowerCase(), token)
        const salt = await bcrypt.genSalt()
        const hashedPassword = await bcrypt.hash(passwordDto.newPassword, salt)
        const updatedPassword = await this.prismaService.userPasswords.update({
            where: { userId: user.id.toString() },
            data: { hashedPassword: hashedPassword, resetToken: "", tokenExpiryDate: null }
        })

        if (!updatedPassword) {
            throw new InternalServerErrorException()
        }
    }

    async getUserByEmailAndResetToken(email: String, token: String): Promise<User> {
        let userObj = await this.prismaService.userPasswords.findFirst({
            where: { resetToken: token.toString(), user: { email: email.toString()} },
            include: { user: true },
        });
        if (!userObj || !userObj.user) {
            throw new BadRequestException("User with this email and valid token doesn't exist")
        }

        if (userObj.tokenExpiryDate && userObj.tokenExpiryDate < new Date()) {
            // invalidate reset token by deleting it from database
            await this.prismaService.userPasswords.update({
                where: { userId: userObj.user.id.toString() },
                data: { resetToken: "" }
            })
            throw new BadRequestException("Reset token got expired. Please try again.")
        }
        return userObj.user
    }

    async saveResetTokenAndExpiry(userId: String, token: String, tokenExpiryDate: Date): Promise<boolean> {
        let result = await this.prismaService.userPasswords.update({
            where: { userId: userId.toString() },
            data: { resetToken: token.toString(), tokenExpiryDate: new Date(tokenExpiryDate) }
        })
        if (!result) {
            throw new InternalServerErrorException()
        }
        return true
    }


    // google log in
    async createGmailUser(dto: UserSignUpDto): Promise<{ access_token: String, user: Users }> {
        let existingUser = await this.findOneByEmail(dto.email)
        if (!existingUser) {
            const user = await this.prismaService.users.create({
                data: {
                    name: dto.name.toString(),
                    email: dto.email.toLowerCase().toString(),
                    isVerified: true,
                    source: "google",
                    roles: [Role[Role.User]],
                    subscriptionPlan: SubscriptionPlan[SubscriptionPlan.Basic],
                },
            });
            const payload = { _id: user.id.toString(), roles: user.roles }
            return { access_token: await this.authService.generateJWT(payload), user: user }
        }
        else {
            const payload = { _id: existingUser.id, roles: existingUser.roles }
            return { access_token: await this.authService.generateJWT(payload), user: existingUser as Users }
        }

    }

}
