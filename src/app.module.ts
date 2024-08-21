import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UsersModule } from './User/Users.module';
import { AuthModule } from './Auth/Auth.module';
import { PrismaService } from './prisma.service';
import { MulterModule } from '@nestjs/platform-express';
import { FileModule } from './Files/file.module';

@Module({
  imports: [
    UsersModule,
    AuthModule,
    FileModule,
    MulterModule.register({
      dest: process.env.FILEUPLOAD_URL, 
      limits: {
        fieldSize: 1000 * 1000 * 10
      }
    })
  ],
  controllers: [AppController],
  providers: [AppService, PrismaService],
})
export class AppModule { }
