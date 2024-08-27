import { BadRequestException, Controller, Delete, Get, InternalServerErrorException, NotFoundException, Post, Query, Req, Request, UploadedFile, UseGuards, UseInterceptors } from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import { ApiBadRequestResponse, ApiBearerAuth, ApiExtraModels, ApiOkResponse, ApiQuery, ApiTags, getSchemaPath } from "@nestjs/swagger";
import { diskStorage } from "multer";
import { join } from "path";
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



@Controller('files')
@UseGuards(AuthGuard, UserIdThrottleGuard)
export class FileController {
  constructor(private readonly fileService: FilesService) { }
  @ApiTags("Files")
  @ApiExtraModels(FileDto)
  @ApiOkResponse(createApiResponseSchema(200, "Success", "File Uploaded successfully", {file:
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
      let fileDto = new FileDto()
      fileDto.fileName = file.filename
      fileDto.originalName = file.originalname
      fileDto.path = `/${process.env.FILE_UPLOAD_DIR}/${file.filename}`
      fileDto.fileSize = file.size
      const user = request['user'] as JWTPayloadModel
      if (user && user._id) {
        fileDto.userId = user._id.valueOf();
        const isUploaded = await this.fileService.saveUploadedFileInfo(fileDto)
        if (isUploaded) {
          return {
            statusCode: 200,
            message: "File Uploaded Successfully",
            fileInfo: fileDto
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
   @ApiBadRequestResponse(createApiResponseSchema(400, "Bad Request","Failed to fetch files"))
   @Throttle({ default: { limit: 1000, ttl: 60000 } })
   @Throttle_Limit(50)
   @Throttle_Ttl(6000)
  async getUserFiles(@Req() request: Express.Request): Promise<{statusCode: Number, message: String, files: FileDto[] }> {
    try {
      // TODO
      const user = request['user'] as JWTPayloadModel
      if (user && user._id) {
        const files = await this.fileService.getAllFilesForUser(user._id);
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
  async delete(@Query('fileId') fileId: String): Promise<{statusCode: Number, message: String, fileId: String }> {
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
}
