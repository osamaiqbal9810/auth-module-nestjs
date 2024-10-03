import {
  IsArray,
  IsBoolean,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator';
import { ChatType } from '../enum/chatType.enum';
import { ApiProperty } from '@nestjs/swagger';


export class ChatHistory {
    @IsString()
    @IsNotEmpty()
    @ApiProperty()
    id: string;
  
    @IsString()
    @IsNotEmpty()
    @ApiProperty()
    userId: string;
  
    @IsString()
    @IsNotEmpty()
    @ApiProperty()
    chatType: ChatType; 

    @IsBoolean()
    @ApiProperty()
    featured: boolean;

    @IsString()
    @ApiProperty()
    answer: string;

    @IsArray()
    @ApiProperty()
    references: ChatReference[];
  
    @IsArray()
    @ApiProperty()
    files: ChatFile[];

    @IsString()
    @IsNotEmpty()
    @ApiProperty()
    question: string;
  
    @IsString()
    @IsNotEmpty()
    @ApiProperty()
    model: string;
  
    @IsInt()
    @IsOptional()
    @ApiProperty()
    referencesCount: number; // it is references count provided by front-end

    constructor(chatHistory?: Partial<ChatHistory>) {
      this.id = chatHistory?.id ?? '';
      this.userId = chatHistory?.userId ?? '';
      this.chatType = chatHistory?.chatType ?? ChatType.Manual;
      this.featured = chatHistory?.featured ?? false;
      this.question = chatHistory?.question ?? '';
      this.answer = chatHistory?.answer ?? '';
      this.model = chatHistory?.model ?? '';
      this.referencesCount = chatHistory?.referencesCount ?? 0;
      this.references = chatHistory?.references ?? [];
      this.files = chatHistory?.files ?? [];
    }
  }


export class PageRange {
  
  @ApiProperty()
  @IsInt()
  start: number;

  @ApiProperty()
  @IsInt()
  end: number;

  constructor(pageRange?: Partial<PageRange>) {
    this.start = pageRange?.start ?? 0;
    this.end = pageRange?.end ?? 0;
  }
}

export class ChatFile {
  @IsString()
  @IsNotEmpty()
  @ApiProperty()
  fileId: string;

  @IsString()
  @IsNotEmpty()
  @ApiProperty()
  fileName: string;

  @IsString()
  @IsNotEmpty()
  @ApiProperty()
  fileType: string;

  @IsInt()
  @IsOptional()
  @ApiProperty()
  totalPages: number;

  @IsArray()
  @ApiProperty()
  pageRanges: PageRange[];

  constructor(file?: Partial<ChatFile>) {
    this.fileId = file?.fileId ?? '';
    this.fileName = file?.fileName ?? '';
    this.fileType = file?.fileType ?? '';
    this.totalPages = file?.totalPages ?? 1;
    this.pageRanges = file?.pageRanges ?? [];
  }
}

export class ChatReference {
  @IsString()
  @IsNotEmpty()
  @ApiProperty()
  fileName: string;

  @IsString()
  @IsNotEmpty()
  @ApiProperty()
  fileId: string;

  @IsInt()
  @ApiProperty()
  pageNo: number;

  constructor(reference?: Partial<ChatReference>) {
    this.fileName = reference?.fileName ?? '';
    this.fileId = reference?.fileId ?? '';
    this.pageNo = reference?.pageNo ?? 0;
  }
}


export class TokensUsed {
  @IsNumber()
  input: number;

  @IsNumber()
  output: number;

  constructor(token?: TokensUsed) {
    this.input = token?.input ?? 0
    this.output = token?.output ?? 0
  }
}


