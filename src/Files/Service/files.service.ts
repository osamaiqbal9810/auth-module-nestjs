import { Injectable } from "@nestjs/common";
import { FileDto } from "../DTO/file.dto";
import { PrismaService } from "src/prisma.service";
import { files } from "@prisma/client";
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

    async getAllFilesForUser(id: String): Promise<FileDto[]> {
    const files = await this.prismaService.files.findMany({
            where: {userId: id.valueOf(), isRemoved: false}
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

    async deleteFile(fileId: String): Promise<boolean> {
        const deletedFile = await this.prismaService.files.update({
            where: {id: fileId.valueOf(), isRemoved: false},
            data: {
                isRemoved: true
            }
        })
        if (deletedFile) {
            const filePath = `/${process.env.FILEUPLOAD_DIR}/${deletedFile.newFileName}`
            await fs.promises.unlink(filePath);
            return true
        }
        return false
    }
}