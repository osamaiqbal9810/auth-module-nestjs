import { Module } from "@nestjs/common";
import { FilesService } from "./Service/files.service";
import { PrismaService } from "src/prisma.service";
import { FileController } from "./Controller/file.controller";
import { UserService } from "src/User/Service/user-service/user-service.service";
import { FileUtilsService } from "./file.utils";
import { ThrottlerGuard, ThrottlerModule } from "@nestjs/throttler";
import { APP_GUARD } from "@nestjs/core";
import { AuthService } from "src/Auth/Service/auth.service";


@Module({
    imports: [
        ThrottlerModule.forRoot([{
            ttl: Number(process.env.THROTTLE_TTL),
            limit: Number(process.env.THROTTLE_REQUESTS_COUNT),
        }])
    ],
    controllers: [FileController],
    providers: [FilesService, PrismaService, UserService, FileUtilsService,AuthService, {
        provide: APP_GUARD,
        useClass: ThrottlerGuard
      }
      ]
})

export class FileModule { }