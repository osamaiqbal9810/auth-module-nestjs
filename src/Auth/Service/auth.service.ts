import { Injectable, Request } from '@nestjs/common';
import { SignInDto } from '../DTO/SignInDto';
import { UserService } from 'src/User/Service/user-service/user-service.service';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';
import { v4 as uuidv4 } from 'uuid';
import { MailerService } from '@nestjs-modules/mailer';
import { User } from 'src/User/Schema/user.schema';
@Injectable()
export class AuthService {
    constructor(private userService: UserService,  private jwtService: JwtService,private readonly mailService: MailerService) {}

    async signIn(signInDto: SignInDto): Promise<{access_token: string}> {
        const existingUser = await this.userService.getUser(signInDto.email)
        if (existingUser != null) {
            const existingPassword = existingUser.hashedPassword.toString()
            const isMatch = await bcrypt.compare(signInDto.password, existingPassword);
           
            if (isMatch == true) {
                const payload = {_id: existingUser._id.toString()}
              return { access_token: await this.jwtService.signAsync(payload) }
            }
        }
       return null
    }

    async generatePasswordResetToken(email: string, serverUrl: string): Promise<boolean> {
        const user = await this.userService.findOne(email);
        if (user) {
            const token = uuidv4(); // Generate a unique token
            const expirationDate = new Date();
            expirationDate.setMinutes(expirationDate.getMinutes() + 5)
            let emailSent = await this.sendForgotPasswordEmail(user, token, expirationDate, serverUrl);
            return emailSent ? true : false
        }
        return false
      }

      async sendForgotPasswordEmail(user: User, token: string, expirationDate: Date, serverUrl: string): Promise<boolean> {
       const resetUrl = `${serverUrl}/reset-password?token=${token}`;
       console.log(process.env.EMAIL_USERNAME, user.email.toString())
       await this.userService.saveResetTokenAndExpiry(user, token, expirationDate)
      
        this.mailService.sendMail({
          from: process.env.EMAIL_USERNAME,
          to: user.email.toString(),
          subject: `Forgot Password`,
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
                        <p style="margin: 0; font-size: 16px; color: #555555;">Forgot your password? If you didn't forget your password, please ignore this email!.</p>
                        
                        <a href="${resetUrl}">${resetUrl}</a>
                    </div>
                </div>

            </body>
            </html>`
        });

        return true
    }
}


