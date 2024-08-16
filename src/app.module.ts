import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UsersModule } from './User/Users.module';
import { AuthModule } from './Auth/Auth.module';
import { PrismaService } from './prisma.service';

@Module({
  imports: [
    UsersModule,
    AuthModule
  ],
  controllers: [AppController],
  providers: [AppService, PrismaService],
})
export class AppModule { }
