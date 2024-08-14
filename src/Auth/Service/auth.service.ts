import { Injectable } from '@nestjs/common';
import { SignInDto } from '../DTO/SignInDto';
import { UserService } from 'src/User/service/user-service/user-service.service';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';
import { v4 as uuidv4 } from 'uuid';
import { MailerService } from '@nestjs-modules/mailer';
@Injectable()
export class AuthService {
    constructor(private userService: UserService,  private jwtService: JwtService,private readonly mailService: MailerService) {}

    async signIn(signInDto: SignInDto): Promise<{access_token: string}> {
        const existingUser = await this.userService.getUser(signInDto.email)
        if (existingUser != null) {
            const existingPassword = existingUser.hashedPassword.toString()
            const isMatch = await bcrypt.compare(signInDto.password, existingPassword);
            console.log(isMatch)
            if (isMatch == true) {
                const payload = {_id: existingUser._id.toString()}
              return { access_token: await this.jwtService.signAsync(payload) }
            }
        }
       return null
    }

    async generatePasswordResetToken(email: string): Promise<void> {
        const user = await this.userService.findOne(email);
        if (!user) {
          throw new Error('User not found');
        }
    
        const token = uuidv4(); // Generate a unique token
        const expirationDate = new Date();
       console.log(token)
        await this.sendForgotPasswordEmail(user.id, token);
      }

      async sendForgotPasswordEmail(email: string, token: string) {
       // const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${token}`;
        this.mailService.sendMail({
          from: 'osamaiqbalcs@gmail.com',
          to: 'osamaiqbalcs@gmail.com',
          subject: `Forgot Password`,
          template: "./EmailTemplate",
        });
    }
}


