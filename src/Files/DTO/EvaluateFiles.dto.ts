import { ApiProperty } from "@nestjs/swagger";

export class EvaluateFilesDto {
    @ApiProperty()
    files?: string[];

    @ApiProperty()
    urls?: string[];
  }

  export class EvaluationResponse {
    statusCode?: number;
    message?: string;
    data?: {
      files: Array<{ filename: string; alreadyExists: boolean }>;
      urls: Array<{ filename: string; alreadyExists: boolean }>;
    };
  }