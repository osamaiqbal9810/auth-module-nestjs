import { Module } from "@nestjs/common";
import { FilesService } from "./Service/files.service";
import { PrismaService } from "src/prisma.service";
import { FileController } from "./Controller/file.controller";
import { UserService } from "src/User/Service/user-service/user-service.service";
import { FileUtilsService } from "./file.utils";
import { AuthService } from "src/Auth/Service/auth.service";
import { ThrottlerModule } from "@nestjs/throttler/dist/throttler.module";
import { APP_GUARD } from "@nestjs/core";
import { ThrottlerGuard } from "@nestjs/throttler";
import { UserIdThrottleGuard } from "src/throttleUser.guard";
import { AuthGuard } from "src/Auth/auth.guard";



@Module({
    imports: [    
        ThrottlerModule.forRoot([{
        ttl: Number(process.env.THROTTLE_TTL),
        limit: Number(process.env.THROTTLE_REQUESTS_COUNT),
    }])],
    controllers: [FileController],
    providers: [FilesService, PrismaService, UserService, FileUtilsService,AuthService,
        {
            provide: APP_GUARD,
            useClass: AuthGuard,
        },
        {
        provide: APP_GUARD,
        useClass: ThrottlerGuard,
      }, {
        provide: APP_GUARD,
        useClass: UserIdThrottleGuard
      }
      ]
})

export class FileModule { }