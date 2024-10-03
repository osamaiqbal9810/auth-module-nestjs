import { Injectable } from "@nestjs/common";

import { PrismaService } from "src/prisma.service";
import { Files } from "@prisma/client";
import * as fs from 'fs';
import { SelectedDoc } from "src/Chat/DTO/Ask.dto";
import { spawn } from 'child_process';
import { PageRange } from "src/Chat/Model/ChatHistory.model";
import { FileModel } from "../DTO/file.dto";


// used to pass file info to python script while uploading file
export interface PythonFileInfo {
  file_id: String, 
  file_path: String, 
  file_format: String
}

@Injectable()
export class FilesService {
  constructor(private prismaService: PrismaService) { }

  async saveUploadedFileInfo(fileDto: FileModel): Promise<Files> {
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

  async getAllFilesOfUser(id: String): Promise<FileModel[]> {
    const files = await this.prismaService.files.findMany({
      where: { userId: id.valueOf(), isRemoved: false }
    });

    return files.map((file) => {
      return new FileModel({
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

  async getFilesBasedOnTags(userId: string, tags: string[]): Promise<SelectedDoc[]> {
    const userFiles = await this.getAllFilesOfUser(userId)
    if (userFiles) {
      const filesBasedOnTags = userFiles.filter((file) => 
        tags.some(tag => file.tags?.includes(tag))
      );
      return filesBasedOnTags.map((file) => {
        return new SelectedDoc({
          fileId: file.id,
          pageRanges: [new PageRange({start: 0, end: file.totalPages})]
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

  async unlinkFileFromDirectory(filePath: string): Promise<boolean> {
    try {
      await fs.promises.unlink(filePath);
      return true;
    } catch (error) {
      return false; // Return false if there was an error
    }
  }

  async updateFileChunksAndPages(fileId: String, chunksAndPages: { chunks: Number, pages: Number }): Promise<Files> {
    return await this.prismaService.files.update({
      where: { id: fileId.valueOf(), isRemoved: false },
      data: {
        totalChunks: chunksAndPages.chunks.valueOf(),
        totalPages: chunksAndPages.pages.valueOf()
      }
    })
   
  }

  async get_file_chunks_and_pages(user_id: String, fileInfo: PythonFileInfo): Promise<{ chunks: number, pages: number }> {
    const inputData = {
      user_id,
     fileInfo
    };

    try {
      return new Promise((resolve, reject) => {
        // Start the Python process
        const pythonProcess = spawn('python', ['./src/Files/fileProcessing.py']);
    
        // Write the input data to the Python script
        pythonProcess.stdin.write(JSON.stringify(inputData));
        pythonProcess.stdin.end(); // Close the stdin to signal that we're done sending data
    
        let output = '';
    
        // Listen for data coming from stdout
        pythonProcess.stdout.on('data', (data) => {
          output += data.toString(); // Accumulate the output data
        });
    
        // Listen for errors from stderr
        pythonProcess.stderr.on('data', (data) => {
          console.error('Error:', data.toString());
        });
    
        // When the process closes, resolve or reject the promise
        pythonProcess.on('close', (code) => {
          if (code !== 0) {
            reject(new Error(`Python process exited with code ${code}`));
          } else {
            try {
              // Parse the output JSON
              resolve(JSON.parse(output));
            } catch (error) {
              reject(error); // Handle parsing error
            }
          }
        });
      });
    } catch (error) {
      console.error('Error executing Python script:', error);
      throw new Error('Failed to process file');
    }
  }
  
}