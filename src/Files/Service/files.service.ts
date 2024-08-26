import { Injectable } from "@nestjs/common";
import { FileDto } from "../DTO/file.dto";
import { PrismaService } from "src/prisma.service";
import { planProperties, SubscriptionPlan } from "src/User/enums/SubscriptionPlan.enum";
import { files } from "@prisma/client";
import * as path from "path";
import * as fs from 'fs';

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
                fileSize: fileDto.fileSize.valueOf() // `Number` to `number`
            }
        });
    }

    async getAllFilesForUser(id: string): Promise<FileDto[]> {
    const files = await this.prismaService.files.findMany({
            where: {userId: id, isRemoved: false}
        })

        return  files.map((file)=> {
            const dto = new FileDto()
            dto.id = file.id
            dto.originalName = file.originalFileName
            dto.fileName = file.newFileName
            dto.path = file.filePath
            dto.fileSize = Number(file.fileSize)
            dto.userId = file.userId
            return dto
        })
    }

    async deleteFile(fileId: string): Promise<boolean> {
        const deletedFile = await this.prismaService.files.update({
            where: {id: fileId, isRemoved: false},
            data: {
                isRemoved: true
            }
        })
        if (deletedFile) {
            const filePath = `/${process.env.FILEUPLOAD_DIR}/${deletedFile.newFileName}`
            const unlink = await fs.promises.unlink(filePath);
            return true
        }
        return false
    }
}