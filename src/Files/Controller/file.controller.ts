import { BadRequestException, Controller, Delete, Get, HttpStatus, InternalServerErrorException, Post, Query, Req, Request, Res, Response, UploadedFile, UseGuards, UseInterceptors } from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import { ApiBadRequestResponse, ApiBearerAuth, ApiNotModifiedResponse, ApiOkResponse, ApiQuery, ApiResponse, ApiTags, getSchemaPath } from "@nestjs/swagger";
import { diskStorage } from "multer";
import { join } from "path";
import { FileDto } from "../DTO/File.dto";
import { FILE_SIZE } from "../file-constnats";
import { FilesService } from "../Service/files.service";


import { UserService } from "src/User/Service/user-service/user-service.service";
import { FileUtilsService } from "../file.utils";
import { SkipThrottle } from "@nestjs/throttler";
import { DeleteFileDto } from "../DTO/DeleteFile.dto";
import { createApiResponseSchema } from "src/ErrorResponse.utils";
import { AuthGuard } from "src/Auth/auth.guard";
import { error } from "console";



@Controller('files')
@UseGuards(AuthGuard)
export class FileController {
  constructor(private readonly fileService: FilesService, private readonly userService: UserService) { }
  @ApiTags("Files")
  @Post("/upload")
  @ApiBearerAuth()

  // Rate limiting is applied to this route.
  @SkipThrottle({ default: false })
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: join(process.cwd(), process.env.FILEUPLOAD_DIR),
        filename: FileUtilsService.fileNameEditor
      }),
      limits: {
        fileSize: FILE_SIZE
      },
      fileFilter: FileUtilsService.fileFilter
    })
  )

  @ApiOkResponse(createApiResponseSchema(200, "Success", "File Uploaded successfully", {
    file: {
      $ref: getSchemaPath(FileDto),
    }
  }))
  @ApiBadRequestResponse(createApiResponseSchema(400, "Bad Request", "Failed to upload file"))
  async uploadFile(@Response() res, @UploadedFile() file: Express.Multer.File, @Request() request): Promise<{ message: string, fileInfo: FileDto }> {
    try {
      if (!file) {
        throw new Error('No file uploaded');
      }
      let fileDto = new FileDto()
      fileDto.fileName = file.filename
      fileDto.originalName = file.originalname
      fileDto.path = `/${process.env.FILEUPLOAD_DIR}/${file.filename}`
      fileDto.fileSize = file.size
      const userId = request['user']?._id
      if (userId) {
        fileDto.userId = userId;
        const isUploaded = this.fileService.saveUploadedFileInfo(fileDto)
        if (isUploaded) {
          return res.status(HttpStatus.OK).json({
            message: "File Uploaded Successfully",
            fileInfo: fileDto
          })
        }
        else {
          throw new BadRequestException({ error: "Error" })
        }
      }
    } catch (err) {
      throw new InternalServerErrorException()
    }
  }

  @Get()
  @ApiTags("Files")
  @ApiBearerAuth()
  @ApiOkResponse(createApiResponseSchema(200, "Success","Files fetching success", {
    file: {
      $ref: getSchemaPath(FileDto),
    }
  }))
   @ApiBadRequestResponse(createApiResponseSchema(400, "Bad Request","Failed to fetch files"))
  async getUserFiles(@Req() request: Request, @Response() response): Promise<{ message: string, files: FileDto[] }> {
    try {
      const userId = request['user']?._id;
      if (userId) {
        const files = await this.fileService.getAllFilesForUser(userId);
        if (files) {
          return response.status(HttpStatus.OK).json({
            message: "Files fetching success",
            files
          })
        }
        else {
          return response.status(HttpStatus.BAD_REQUEST).json({
            message: response.message
          })
        }
      }
      else {
        return response.status(HttpStatus.NOT_FOUND).json({
          message: response.message
        })
      }
    } catch (err) {
      throw new InternalServerErrorException()
    }
  }

  @Delete()
  @ApiTags("Files")
  @ApiBearerAuth()
  @ApiOkResponse(createApiResponseSchema(200, "Success", "File deleted successfully."))
  @ApiBadRequestResponse(createApiResponseSchema(400, "Bad Request", "Failed to delete file"))

  @ApiQuery({ name: "fileId", type: DeleteFileDto })
  async delete(@Query('fileId') fileId: string, @Res() response) {
    try {
      const isDeleted = await this.fileService.deleteFile(fileId)
      if (isDeleted) {
        return response.status(HttpStatus.OK).json({
          message: "File deleted successfully"
        })
      }
      else {
        return response.status(HttpStatus.BAD_REQUEST).json({
          message: response.message
        })
      }
    } catch (error) {
      throw new InternalServerErrorException()
    }
  }

}
