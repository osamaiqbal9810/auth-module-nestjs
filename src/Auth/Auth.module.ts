import { forwardRef, Module } from "@nestjs/common";
import { AuthController } from "./Controller/auth.controller";
import { AuthService } from "./Service/auth.service";
import { UsersModule } from "src/User/Users.module";
import { MailerModule } from "@nestjs-modules/mailer";
import { ConfigModule } from "@nestjs/config";
import { JwtModule } from "@nestjs/jwt";
import { PrismaService } from "src/prisma.service";
import { GoogleStrategy } from "src/Auth/Strategies/google.strategy";


@Module({
    imports:[    
      forwardRef(() => UsersModule),
        ConfigModule.forRoot({ isGlobal: true }),
        JwtModule.register({
        global: true,
        secret: process.env.JWT_SECRET,
        signOptions: { expiresIn: process.env.JWT_EXPIRY },
      }),
      MailerModule.forRoot({
        transport: {
          host: process.env.EMAIL_HOST,
          auth: {
            user: process.env.EMAIL_USERNAME,
            pass: process.env.EMAIL_PASSWORD,
          },
        }
      }),
    ],
    controllers: [AuthController],
    providers: [AuthService, PrismaService, GoogleStrategy],
    exports:[AuthService]
})

export class AuthModule {}