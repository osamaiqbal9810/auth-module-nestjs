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
    references: ChatReferences[];
  
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


export class PageRanges {
  
  @ApiProperty()
  @IsInt()
  startPageNo: number;

  @ApiProperty()
  @IsInt()
  endPageNo: number;

  constructor(pageRange?: Partial<PageRanges>) {
    this.startPageNo = pageRange?.startPageNo ?? 0;
    this.endPageNo = pageRange?.endPageNo ?? 0;
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
  pageRanges: PageRanges[];

  constructor(file?: Partial<ChatFile>) {
    this.fileId = file?.fileId ?? '';
    this.fileName = file?.fileName ?? '';
    this.fileType = file?.fileType ?? '';
    this.totalPages = file?.totalPages ?? 1;
    this.pageRanges = file?.pageRanges ?? [];
  }
}

export class ChatReferences {
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

  constructor(reference?: Partial<ChatReferences>) {
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


