import { BadRequestException, Body, Controller, Delete, Get, InternalServerErrorException, NotFoundException, Post, Put, Query, Req, Request, UploadedFile, UseGuards, UseInterceptors } from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import { ApiBadRequestResponse, ApiBearerAuth, ApiBody, ApiExtraModels, ApiOkResponse, ApiQuery, ApiTags, getSchemaPath } from "@nestjs/swagger";
import { diskStorage } from "multer";
import { extname, join } from "path";
import { FILE_SIZE, FILE_UPLOAD_DIR, Throttle_Limit, Throttle_Ttl } from "../../../Global.constnats";
import { PythonFileInfo, FilesService } from "../Service/files.service";
import { FileUtilsService } from "../file.utils";
import { DeleteFileDto } from "../DTO/DeleteFile.dto";
import { createApiResponseSchema } from "src/ErrorResponse.utils";
import { FileModel } from "../DTO/file.dto";
import { JWTPayloadModel } from "../../User/JWTPayload.model";
import { Throttle } from "@nestjs/throttler";
import { AuthGuard } from "src/Auth/auth.guard";
import { UserIdThrottleGuard } from "src/User/throttleUser.guard";
import { UpdateFileTagsDto } from "../DTO/UpdateFileTags.dto";
import { EvaluateFilesDto, EvaluationResponse } from "../DTO/EvaluateFiles.dto";


@Controller('files')
@UseGuards(AuthGuard, UserIdThrottleGuard)
export class FileController {
  constructor(private readonly fileService: FilesService) { }
  @ApiTags("Files")
  @ApiExtraModels(FileModel)
  @ApiOkResponse(createApiResponseSchema(200, "Success", "File Uploaded successfully", {
    data:
    {
      $ref: getSchemaPath(FileModel),
    }
  }))
  @ApiBadRequestResponse(createApiResponseSchema(400, "Bad Request", "Failed to upload file"))
  @Throttle({ default: { limit: 1000, ttl: 60000 } })
  @Throttle_Limit(50)
  @Throttle_Ttl(6000)
  @Post("upload")
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

  async uploadFile(@UploadedFile() file: Express.Multer.File, @Request() request: Express.Request): Promise<{ statusCode: Number, message: String }> {
    try {
      if (!file) {
        throw new BadRequestException('No file uploaded');
      }

      const fileType = extname(file.originalname)
      var relativeFilePath = `${process.env.FILE_UPLOAD_DIR}/${file.filename}`
      let fileDto = new FileModel()
      fileDto.fileName = file.filename
      fileDto.originalName = file.originalname
      fileDto.path = ""
      fileDto.fileSize = file.size
      fileDto.fileType = fileType

      const user = request['user'] as JWTPayloadModel
      if (user && user._id) {
        fileDto.userId = user._id.valueOf();
        const uploadedFile = await this.fileService.saveUploadedFileInfo(fileDto)
        if (uploadedFile) {

          // uploadedFile.id, uploadedFile.filePath, fileType
          let fileInfo: PythonFileInfo = {
            file_id: uploadedFile.id,
            file_path: `${process.cwd()}/${relativeFilePath}`,
            file_format: uploadedFile.fileType
          }
          let chunksAndPages = await this.fileService.get_file_chunks_and_pages(user._id, fileInfo)
          // update the number of chunks geenerated and totalNumber of pages of document (provided by python func)
          const updatedFile = await this.fileService.updateFileChunksAndPages(uploadedFile.id, chunksAndPages)
          if (updatedFile) {
            // delete the file once embedding and vectors gets generated
            let deletedFile = await this.fileService.unlinkFileFromDirectory(fileInfo.file_path.valueOf())
            if (deletedFile) {

              return {
                statusCode: 200,
                message: "File Uploaded & processed successfully",
                //   data: updatedFile
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
      console.log(err)
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
    data: {
      type: 'array',
      items: { $ref: getSchemaPath(FileModel) }
    }
  }))
  @ApiBadRequestResponse(createApiResponseSchema(400, "Bad Request", "Failed to fetch files"))
  @Throttle({ default: { limit: 1000, ttl: 60000 } })
  @Throttle_Limit(50)
  @Throttle_Ttl(6000)
  async getUserFiles(@Req() request: Express.Request): Promise<{ statusCode: Number, message: String, data: FileModel[] }> {
    try {

      const user = request['user'] as JWTPayloadModel
      if (user && user._id) {
        const files = await this.fileService.getAllFilesOfUser(user._id);
        if (files) {
          return {
            statusCode: 200,
            message: "Files fetching success",
            data: files
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
    data: {
      type: 'string',
      example: '8d9384398743749347397b'
    }
  }))
  @ApiBadRequestResponse(createApiResponseSchema(400, "Bad Request", "Failed to delete file"))
  @Throttle({ default: { limit: 1000, ttl: 60000 } })
  @Throttle_Limit(50)
  @Throttle_Ttl(6000)
  @ApiQuery({ name: "fileId", type: DeleteFileDto })
  async delete(@Query('fileId') fileId: String): Promise<{ statusCode: Number, message: String, data: String }> {
    try {
      const isDeleted = await this.fileService.deleteFile(fileId)
      if (isDeleted) {
        return {
          statusCode: 200,
          message: "File deleted successfully.",
          data: fileId
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
  @Put("/fileTags")
  @ApiQuery({ name: "fileId", type: DeleteFileDto })
  @ApiBody({ type: UpdateFileTagsDto })
  @ApiBearerAuth()
  @ApiOkResponse(createApiResponseSchema(200, "Success", "File Tag updated successfully.", {
    data: {
      type: 'string',
      example: '8d9384398743749347397b'
    }
  }))
  @ApiBadRequestResponse(createApiResponseSchema(400, "Bad Request", "Failed to update file tag"))
  async updateFileTag(@Query('fileId') fileId: String, @Body() fileTag: UpdateFileTagsDto): Promise<{ statusCode: Number, message: String, data: String }> {
    try {
      const isTagUpdated = await this.fileService.updateFileTag(fileId, fileTag.fileTags)
      if (isTagUpdated) {
        return {
          statusCode: 200,
          message: "File Tag updated successfully.",
          data: fileId
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

  @Post('evaluateFiles')
  @ApiTags("Files")
  @ApiExtraModels(EvaluateFilesDto, EvaluationResponse)
  @ApiBody({ type: EvaluateFilesDto })
  @UseGuards(AuthGuard)
  @ApiBearerAuth()
 
  @ApiOkResponse(createApiResponseSchema(200, "Success", "Files evaluated successfully.", {
    data:
    {
      $ref: getSchemaPath(EvaluationResponse),
    }
  }))
  async evaluateFiles(@Req() request: Express.Request, @Body() evaluateFilesDto: EvaluateFilesDto): Promise<EvaluationResponse> {
    try {
      const user = request['user'] as JWTPayloadModel
      const { files = [], urls = [] } = evaluateFilesDto;
      const evaluation = await this.fileService.evaluateFiles(user._id.valueOf(), files, urls);
      return {
        statusCode: 200,
        message: "Files evaluated successfully.",
        data: evaluation
      }
    } catch (error) {
      throw new InternalServerErrorException()
    }
  }

}