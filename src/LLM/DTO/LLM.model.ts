import { ApiProperty } from "@nestjs/swagger";
import { IsString } from "class-validator";

export class LLMModel {
    @ApiProperty()
    @IsString()
    vendor: string;
    
    @ApiProperty()
    @IsString()
    modelName: string;
    
    @ApiProperty()
    @IsString()
    modelId: string;
    
    @ApiProperty()
    @IsString()
    apiKey: string;
    
    @ApiProperty()
    @IsString()
    modelShort: string;
    
    @ApiProperty()
    @IsString()
    enabled: boolean;

  
    constructor(data?: Partial<LLMModel>) {
      this.vendor = data?.vendor ?? '';
      this.modelName = data?.modelName ?? '';
      this.modelId = data?.modelId ?? '';
      this.apiKey = data?.apiKey ?? '';
      this.modelShort = data?.modelShort ?? '';
      this.enabled = data?.enabled ?? false;
    }
  }