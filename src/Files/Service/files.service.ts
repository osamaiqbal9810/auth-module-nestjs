import { Injectable } from "@nestjs/common";
import { FileDto } from "../DTO/FileDto";
import { PrismaService } from "src/prisma.service";
import { planProperties, SubscriptionPlan } from "src/User/enums/SubscriptionPlan.enum";
import { files } from "@prisma/client";

@Injectable()
export class FilesService {
    constructor(private prismaService: PrismaService) { }

    async saveUploadedFileInfo(fileDto: FileDto): Promise<files> {
     return await  this.prismaService.files.create({
            data: {
                originalFileName: fileDto.originalName,
                newFileName: fileDto.fileName,
                filePath: fileDto.path,
                userId: fileDto.userId,
                fileSize: fileDto.fileSize.valueOf() // Number to number
            }
        });
    }

    async getAllFilesForUser(id: string) {
        await this.prismaService.files.findMany({
            where: {userId: id, isRemoved: false}
        })
    }
}