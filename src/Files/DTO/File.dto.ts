import { Optional } from "@nestjs/common";
import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsNumber, IsString } from "class-validator";


export class FileDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  id: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  originalName: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  fileName: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  path: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  userId: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  fileType: string;

  @ApiProperty()
  @IsNumber()
  @IsNotEmpty()
  fileSize: number;

  @IsNumber()
  totalPages: number;

  @IsNumber()
  totalChunks: number;

  @ApiProperty()
  @Optional()
  tags?: string[]

  constructor(fileDto?: Partial<FileDto>) {
    this.id = fileDto?.id ?? '';
    this.originalName = fileDto?.originalName ?? '';
    this.fileName = fileDto?.fileName ?? '';
    this.path = fileDto?.path ?? '';
    this.userId = fileDto?.userId ?? '';
    this.fileType = fileDto?.fileType ?? '';
    this.fileSize = fileDto?.fileSize ?? 0;
    this.totalChunks = fileDto?.totalChunks ?? 0
    this.totalPages = fileDto?.totalPages ?? 0
    this.tags = fileDto?.tags ?? []
  }
}
