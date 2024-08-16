import { Module } from '@nestjs/common';
import { UserController } from './Controller/user-controller.controller';
import { UserService } from './Service/user-service/user-service.service';
import { PrismaService } from 'src/prisma.service';


@Module({
    imports: [],
    controllers:[UserController],
    providers:[UserService,PrismaService],
    exports: [UserService],
})

export class UsersModule{}