import { forwardRef, Module } from '@nestjs/common';
import { UserController } from './Controller/user-controller.controller';
import { UserService } from './Service/user-service/user-service.service';
import { PrismaService } from 'src/prisma.service';
import { APP_GUARD } from '@nestjs/core';
import { RolesGuard } from './roles.guard';
import { FilesService } from 'src/Files/Service/files.service';
import { AuthModule } from 'src/Auth/Auth.module';


@Module({
    imports: [forwardRef(() => AuthModule)],
    controllers:[UserController],
    providers:[UserService,PrismaService, FilesService],
    exports: [UserService, FilesService],
})

export class UsersModule{}