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

    @ApiProperty()
    @IsBoolean()
    isDefault: boolean;


    constructor(modelId: string, apiKey: string, enabled: boolean, isDefault: boolean) {
        this.modelId = modelId;
        this.apiKey = apiKey;
        this.enabled = enabled;
        this.isDefault = isDefault;
    }
}
