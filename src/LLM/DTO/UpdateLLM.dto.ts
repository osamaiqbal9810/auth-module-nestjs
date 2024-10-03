// update-api-key.dto.ts
import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsBoolean } from 'class-validator';

export class UpdateLLMDto {
    @ApiProperty()
    @IsString()
    @IsNotEmpty()
    modelId: string;

    @ApiProperty()
    @IsString()
    @IsNotEmpty()
    apiKey: string;

    @ApiProperty()
    @IsBoolean()
    enabled: boolean;

    constructor(modelId: string, apiKey: string, enabled: boolean) {
        this.modelId = modelId;
        this.apiKey = apiKey;
        this.enabled = enabled;
    }
}
