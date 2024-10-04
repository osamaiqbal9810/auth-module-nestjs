import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UsersModule } from './User/Users.module';
import { AuthModule } from './Auth/Auth.module';
import { PrismaService } from '../prisma/prisma.service';
import { MulterModule } from '@nestjs/platform-express';
import { FileModule } from './Files/file.module';
import { ServeStaticModule } from '@nestjs/serve-static';
import * as path from 'path';
import { FILE_UPLOAD_DIR } from '../Global.constnats';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { ChatModule } from './chat/chat.module';
import { LLMModule } from './LLM/llm.module';


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
      rootPath: path.join(process.cwd(), process.env.FILE_UPLOAD_DIR ?? FILE_UPLOAD_DIR),
      serveRoot: `/${process.env.FILE_UPLOAD_DIR}`, // URL path prefix for serving static files,
      serveStaticOptions: {
        index: false
       },
    }),
    ThrottlerModule.forRoot([{
      ttl: Number(process.env.THROTTLE_TTL),
      limit: Number(process.env.THROTTLE_REQUESTS_COUNT),
  }]),
    ChatModule,
    LLMModule
  ],
  controllers: [AppController],
  providers: [AppService, PrismaService, {
    provide: APP_GUARD,
    useClass: ThrottlerGuard,
  }],
})
export class AppModule { }
