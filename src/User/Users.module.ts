import { forwardRef, Module } from '@nestjs/common';
import { UserController } from './Controller/user-controller.controller';
import { UserService } from './Service/user-service/user-service.service';
import { PrismaService } from 'src/prisma.service';
import { FilesService } from 'src/Files/Service/files.service';
import { AuthModule } from 'src/Auth/Auth.module';
import { ThrottlerStorageService } from '@nestjs/throttler';



@Module({
    imports: [forwardRef(() => AuthModule)],
    controllers:[UserController],
    providers:[UserService,PrismaService, FilesService,ThrottlerStorageService],
    exports: [UserService, FilesService],
})

export class UsersModule{}