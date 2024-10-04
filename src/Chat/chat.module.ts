import { Module } from '@nestjs/common';
import { ChatController } from './chat.controller';
import { ChatService } from './chat.service';
import { UsersModule } from 'src/User/Users.module';
import { PrismaService } from '../../prisma/prisma.service';
import { LLMService } from 'src/LLM/llm.service';


  @Module({
    imports: [UsersModule],
    controllers: [ChatController],
    providers: [ChatService, PrismaService, LLMService]
  })

  export class ChatModule { }