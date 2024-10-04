import { Module } from "@nestjs/common";
import { LLMService } from "./llm.service";
import { PrismaService } from "../../prisma/prisma.service";
import { LLMController } from "./llm.controller";
import { UsersModule } from "src/User/Users.module";
import { AuthService } from "src/Auth/Service/auth.service";


@Module({
    imports: [UsersModule],
    controllers: [LLMController],
    providers: [LLMService, PrismaService, AuthService]
})

export class LLMModule {}