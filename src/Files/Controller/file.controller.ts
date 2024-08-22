import { Controller, Get, HttpStatus, Post, Req, Res, Response, UploadedFile, UseGuards, UseInterceptors } from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import { ApiBearerAuth } from "@nestjs/swagger";
import { diskStorage } from "multer";
import { join } from "path";
import { AuthGuard } from "src/Auth/auth.guard";
import { FileDto } from "../DTO/FileDto";
import { FILE_SIZE } from "../file-constnats";
import { FilesService } from "../Service/files.service";
import { Request, response } from "express";

import { UserService } from "src/User/Service/user-service/user-service.service";
import { FileUtilsService } from "../file.utils";
import { SkipThrottle } from "@nestjs/throttler";
import { error } from "console";
// import { fileFilter, fileNameEditor, getUserFromRequest } from "../file.utils";
@Controller('files')
export class FileController {
  constructor(private readonly fileService: FilesService, private readonly userService: UserService) { }

  @Post("/upload")
  @ApiBearerAuth()
  @UseGuards(AuthGuard)
  // Rate limiting is applied to this route.
  @SkipThrottle({ default: false })
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: join(process.cwd(), 'uploads'),
        filename: FileUtilsService.fileNameEditor
      }),
      limits: {
        fileSize: FILE_SIZE
      },
      fileFilter: FileUtilsService.fileFilter
    })
  )
  async uploadFile(@Response() res, @UploadedFile() file: Express.Multer.File, @Req() request: Request) {
    try {
      let fileDto = new FileDto()
      fileDto.fileName = file.filename
      fileDto.originalName = file.originalname
      fileDto.path = `${process.env.FILEUPLOAD_URL}/${file.filename}`
      fileDto.fileSize = file.size
      const user = await FileUtilsService.getUserFromRequest(request)
      if (user) {
        fileDto.userId = user.id.valueOf();
        const isUploaded = this.fileService.saveUploadedFileInfo(fileDto)
        if (isUploaded) {
          return res.status(HttpStatus.OK).json({
            message: "File Uploaded Successfully",
            fileInfo: fileDto
          })
        }
        else {
          return res.status(HttpStatus.EXPECTATION_FAILED).json({
            message: res.message
          })
        }
      }
    } catch (err) {
        return res.status(HttpStatus.BAD_REQUEST).json({
          message: err.message
        })
    }
  }

    @Get()
    @ApiBearerAuth()
    @UseGuards(AuthGuard)
    async getUserFiles(@Req() request: Request, @Response() response) {
      try {
        const userId = request['user']?._id;
        if (userId) {
          const files = await this.fileService.getAllFilesForUser(userId);
          // console.log(files)
          if (files) {
            return response.status(HttpStatus.OK).json({
              message: "Files fetching success",
              files
            })
          }
          else {
            return response.status(HttpStatus.EXPECTATION_FAILED).json({
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
        return response.status(HttpStatus.BAD_REQUEST).json({
          message: err.message
        })
    }

  }
}

