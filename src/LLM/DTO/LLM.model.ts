import { ApiProperty } from "@nestjs/swagger";
import { IsString } from "class-validator";

export class LLMModel {
    @ApiProperty()
    @IsString()
    vendor: string;
    
    @ApiProperty()
    @IsString()
    model_name: string;
    
    @ApiProperty()
    @IsString()
    model_id: string;
    
    @ApiProperty()
    @IsString()
    api_key: string;
    
    @ApiProperty()
    @IsString()
    model_short: string;
    
    @ApiProperty()
    @IsString()
    enabled: boolean;

    @ApiProperty()
    @IsString()
    is_default: boolean;
  
    constructor(data?: Partial<LLMModel>) {
      this.vendor = data?.vendor ?? '';
      this.model_name = data?.model_name ?? '';
      this.model_id = data?.model_id ?? '';
      this.api_key = data?.api_key ?? '';
      this.model_short = data?.model_short ?? '';
      this.enabled = data?.enabled ?? false;
      this.is_default = data?.is_default ?? false;
    }
  }