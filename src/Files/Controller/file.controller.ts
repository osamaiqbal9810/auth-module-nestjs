import { BadRequestException, Body, Controller, Delete, Get, InternalServerErrorException, NotFoundException, Post, Put, Query, Req, Request, UploadedFile, UseGuards, UseInterceptors } from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import { ApiBadRequestResponse, ApiBearerAuth, ApiBody, ApiExtraModels, ApiOkResponse, ApiQuery, ApiTags, getSchemaPath } from "@nestjs/swagger";
import { diskStorage } from "multer";
import { extname, join } from "path";
import { FILE_SIZE, FILE_UPLOAD_DIR, Throttle_Limit, Throttle_Ttl } from "../Global.constnats";
import { FilesService } from "../Service/files.service";
import { FileUtilsService } from "../file.utils";
import { DeleteFileDto } from "../DTO/DeleteFile.dto";
import { createApiResponseSchema } from "src/ErrorResponse.utils";
import { FileDto } from "../DTO/file.dto";
import { JWTPayloadModel } from "src/Payload.model";
import { Throttle } from "@nestjs/throttler";
import { AuthGuard } from "src/Auth/auth.guard";
import { UserIdThrottleGuard } from "src/throttleUser.guard";
import { spawn } from 'child_process';
import { FileTagsDto } from "../DTO/FileTags.dto";

// used to pass file info to python script while uploading file
interface FileInfo {
  file_id: String, 
  file_path: String, 
  file_format: String
}


@Controller('files')
@UseGuards(AuthGuard, UserIdThrottleGuard)
export class FileController {
  constructor(private readonly fileService: FilesService) { }
  @ApiTags("Files")
  @ApiExtraModels(FileDto)
  @ApiOkResponse(createApiResponseSchema(200, "Success", "File Uploaded successfully", {
    file:
    {
      $ref: getSchemaPath(FileDto),
    }
  }))
  @ApiBadRequestResponse(createApiResponseSchema(400, "Bad Request", "Failed to upload file"))
  @Throttle({ default: { limit: 1000, ttl: 60000 } })
  @Throttle_Limit(50)
  @Throttle_Ttl(6000)
  @Post("/upload")
  @ApiBearerAuth()
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: join(process.cwd(), process.env.FILE_UPLOAD_DIR ?? FILE_UPLOAD_DIR),
        filename: FileUtilsService.fileNameEditor
      }),
      limits: {
        fileSize: FILE_SIZE
      },
      fileFilter: FileUtilsService.fileFilter
    })
  )

  async uploadFile(@UploadedFile() file: Express.Multer.File, @Request() request: Express.Request): Promise<{ statusCode: Number, message: String, fileInfo: FileDto }> {
    try {
      if (!file) {
        throw new BadRequestException('No file uploaded');
      }
      const fileType = extname(file.originalname)
      let fileDto = new FileDto()
      fileDto.fileName = file.filename
      fileDto.originalName = file.originalname
      fileDto.path = `/${process.env.FILE_UPLOAD_DIR}/${file.filename}`
      fileDto.fileSize = file.size
      fileDto.fileType = fileType
      fileDto.tags = ["Class 1", "English"]

      const user = request['user'] as JWTPayloadModel
      if (user && user._id) {
        fileDto.userId = user._id.valueOf();
        const uploadedFile = await this.fileService.saveUploadedFileInfo(fileDto)
        if (uploadedFile) {
          // TODO: Here call python method (user_id, (file_id,file_path, file_format)) -> (Number of Chunks, No. of Pages)
          // uploadedFile.id, uploadedFile.filePath, fileType
          let fileInfo: FileInfo = {
            file_id: uploadedFile.id,
            file_path: uploadedFile.filePath,
            file_format: uploadedFile.fileType
          }
          let chunksAndPages = await this.get_file_chunks_and_pages(user._id, fileInfo)
          // update the number of chunks geenerated and totalNumber of pages of document (provided by python func)
          const updatedFile = await this.fileService.updateFileChunksAndPages(uploadedFile.id, chunksAndPages)
          if (updatedFile) {
            // delete the file once embedding and vectors gets generated
            let deletedFile = await this.fileService.unlinkFileFromDirectory(uploadedFile.newFileName)
            if (deletedFile) {
              fileDto.id = uploadedFile.id
              fileDto.totalChunks = chunksAndPages.chunks
              fileDto.totalPages = chunksAndPages.pages
              return {
                statusCode: 200,
                message: "File Uploaded & processed successfully",
                fileInfo: fileDto
              }
            }
          } else {
            throw new InternalServerErrorException("Failed to update chunks and pages")
          }
        }
        throw new BadRequestException("Error uploading file")
      }
      throw new NotFoundException("User doesn't exist in request")
    } catch (err) {
      if (err instanceof BadRequestException || err instanceof NotFoundException) {
        throw err
      }
      throw new InternalServerErrorException()
    }
  }

  @Get()
  @ApiTags("Files")
  @ApiBearerAuth()
  @ApiOkResponse(createApiResponseSchema(200, "Success", "Files fetched successfully", {
    files: {
      type: 'array',
      items: { $ref: getSchemaPath(FileDto) }
    }
  }))
  @ApiBadRequestResponse(createApiResponseSchema(400, "Bad Request", "Failed to fetch files"))
  @Throttle({ default: { limit: 1000, ttl: 60000 } })
  @Throttle_Limit(50)
  @Throttle_Ttl(6000)
  async getUserFiles(@Req() request: Express.Request): Promise<{ statusCode: Number, message: String, files: FileDto[] }> {
    try {
      // TODO
      const user = request['user'] as JWTPayloadModel
      if (user && user._id) {
        const files = await this.fileService.getAllFilesOfUser(user._id);
        if (files) {
          return {
            statusCode: 200,
            message: "Files fetching success",
            files
          }
        }
        throw new BadRequestException("Failed to fetch files")
      }
      throw new NotFoundException("User doesn't exist in request")
    } catch (err) {
      if (err instanceof BadRequestException || err instanceof NotFoundException) {
        throw err
      }
      throw new InternalServerErrorException()
    }
  }

  @Delete()
  @ApiTags("Files")
  @ApiBearerAuth()
  @ApiOkResponse(createApiResponseSchema(200, "Success", "File deleted successfully.", {
    fileId: {
      type: 'string',
      example: '8d9384398743749347397b'
    }
  }))
  @ApiBadRequestResponse(createApiResponseSchema(400, "Bad Request", "Failed to delete file"))
  @Throttle({ default: { limit: 1000, ttl: 60000 } })
  @Throttle_Limit(50)
  @Throttle_Ttl(6000)
  @ApiQuery({ name: "fileId", type: DeleteFileDto })
  async delete(@Query('fileId') fileId: String): Promise<{ statusCode: Number, message: String, fileId: String }> {
    try {
      const isDeleted = await this.fileService.deleteFile(fileId)
      if (isDeleted) {
        return {
          statusCode: 200,
          message: "File deleted successfully.",
          fileId: fileId
        }
      }
      throw new BadRequestException("Failed to delete file")
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error
      }
      throw new InternalServerErrorException()
    }
  }

  @ApiTags("Files")
  @Put("/updateFileTag")
  @ApiQuery({ name: "fileId", type: DeleteFileDto })
  @ApiBody({type: FileTagsDto})
  @ApiBearerAuth()
  @ApiOkResponse(createApiResponseSchema(200, "Success", "File Tag updated successfully.", {
    fileId: {
      type: 'string',
      example: '8d9384398743749347397b'
    }
  }))
  @ApiBadRequestResponse(createApiResponseSchema(400, "Bad Request", "Failed to update file tag"))
  async updateFileTag(@Query('fileId') fileId: String, @Body() fileTag: FileTagsDto): Promise<{ statusCode: Number, message: String, fileId: String }> {
    try {
      const isTagUpdated = await this.fileService.updateFileTag(fileId, fileTag.fileTags)
      if (isTagUpdated) {
        return {
          statusCode: 200,
          message: "File Tag updated successfully.",
          fileId: fileId
        }
      }
      throw new BadRequestException("Failed to update file tag")
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error
      }
      throw new InternalServerErrorException()
    }
  }


  // TODO: To be removed after python implementation
  async get_file_chunks_and_pages(user_id: String, fileInfo: FileInfo): Promise<{ chunks: number, pages: number }> {
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