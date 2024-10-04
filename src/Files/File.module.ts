import { Module } from "@nestjs/common";
import { FilesService } from "./Service/files.service";
import { PrismaService } from "../../prisma/prisma.service";
import { FileController } from "./Controller/file.controller";
import { UserService } from "src/User/Service/user-service/user-service.service";
import { FileUtilsService } from "./file.utils";
import { AuthService } from "src/Auth/Service/auth.service";


@Module({
    imports: [],
    controllers: [FileController],
    providers: [FilesService, PrismaService, UserService, FileUtilsService,AuthService]
})

export class FileModule { }