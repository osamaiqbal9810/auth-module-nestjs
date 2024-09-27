import { Injectable } from "@nestjs/common";
import { FileDto } from "../DTO/file.dto";
import { PrismaService } from "src/prisma.service";
import { files } from "@prisma/client";
import * as fs from 'fs';
import { SelectedDocs } from "src/Chat/DTO/Ask.dto";
import { PageRanges } from "src/Chat/Model/ChatHistory.model";

@Injectable()
export class FilesService {
  constructor(private prismaService: PrismaService) { }

  async saveUploadedFileInfo(fileDto: FileDto): Promise<files> {
    return await this.prismaService.files.create({
      data: {
        originalFileName: fileDto.originalName,
        newFileName: fileDto.fileName,
        filePath: fileDto.path,
        userId: fileDto.userId,
        fileType: fileDto.fileType,
        fileSize: fileDto.fileSize.valueOf(), // `Number` to `number`
        tags: fileDto.tags
      }
    });
  }

  async getAllFilesOfUser(id: String): Promise<FileDto[]> {
    const files = await this.prismaService.files.findMany({
      where: { userId: id.valueOf(), isRemoved: false }
    });

    return files.map((file) => {
      return new FileDto({
        id: file.id,
        originalName: file.originalFileName,
        fileName: file.newFileName,
        path: file.filePath,
        userId: file.userId,
        fileType: file.fileType,
        fileSize: Number(file.fileSize),
        totalPages: file.totalPages,
        totalChunks: file.totalChunks,
        tags: file.tags
      });
    });
  }

  async getFilesBasedOnTags(userId: string, tags: string[]): Promise<SelectedDocs[]> {
    const userFiles = await this.getAllFilesOfUser(userId)
    if (userFiles) {
      const filesBasedOnTags = userFiles.filter((file) => 
        tags.some(tag => file.tags?.includes(tag))
      );
      return filesBasedOnTags.map((file) => {
        return new SelectedDocs({
          fileId: file.id,
          pageRanges: [new PageRanges({startPageNo: 0, endPageNo: file.totalPages})]
        })
      })
    }
    return []
  }

  async deleteFile(fileId: String): Promise<boolean> {
    const deletedFile = await this.prismaService.files.update({
      where: { id: fileId.valueOf(), isRemoved: false },
      data: {
        isRemoved: true
      }
    });
    
    if (!deletedFile) {
     return false
    }
    return true;
  }

  async updateFileTag(fileId: String, tags: string[]) {
    const updatedTags = await this.prismaService.files.update({
      where: { id: fileId.valueOf(), isRemoved: false },
      data: {
       tags: tags
      }
    });
    
    if (!updatedTags) {
     return false
    }
    return true;
  }

  async unlinkFileFromDirectory(fileName: String): Promise<boolean> {
    try {
      const fileUploadDir = process.env.FILE_UPLOAD_DIR;
      if (!fileUploadDir) {
      throw new Error("FILE_UPLOAD_DIR environment variable is not defined.");
      }
      const filePath = `${process.cwd()}/${fileUploadDir}/${fileName}`
      await fs.promises.unlink(filePath);
      return true;
    } catch (error) {
      return false; // Return false if there was an error
    }
  }

  async updateFileChunksAndPages(fileId: String, chunksAndPages: { chunks: Number, pages: Number }): Promise<boolean> {
    const updatedFile = await this.prismaService.files.update({
      where: { id: fileId.valueOf(), isRemoved: false },
      data: {
        totalChunks: chunksAndPages.chunks.valueOf(),
        totalPages: chunksAndPages.pages.valueOf()
      }
    })
    if (!updatedFile) {
      return false
    }
    return true
  }
}