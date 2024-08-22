import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UsersModule } from './User/Users.module';
import { AuthModule } from './Auth/Auth.module';
import { PrismaService } from './prisma.service';
import { MulterModule } from '@nestjs/platform-express';
import { FileModule } from './Files/file.module';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';

@Module({
  imports: [
    UsersModule,
    AuthModule,
    FileModule,
    MulterModule.register({
      dest: process.env.FILEUPLOAD_URL, 
      limits: {
        fieldSize: 1000 * 1000 * 10 // TODO
      }
    }),
    ServeStaticModule.forRoot({
      rootPath: join(process.cwd(), 'uploads'),
      serveRoot: '/uploads', // URL path prefix for serving static files,
      serveStaticOptions: {
        index: false
       },
    }),
  ],
  controllers: [AppController],
  providers: [AppService, PrismaService],
})
export class AppModule { }
