import { Module } from '@nestjs/common';
import { UserController } from './Controller/user-controller.controller';
import { UserService } from './Service/user-service/user-service.service';
import { PrismaService } from 'src/prisma.service';
import { APP_GUARD } from '@nestjs/core';
import { RolesGuard } from './roles.guard';
import { AuthGuard } from 'src/Auth/auth.guard';
import { FilesService } from 'src/Files/Service/files.service';


@Module({
    imports: [],
    controllers:[UserController],
    providers:[UserService,PrismaService, {provide: APP_GUARD, useClass: RolesGuard}, FilesService],
    exports: [UserService, FilesService],
})

export class UsersModule{}