// update-api-key.dto.ts
import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsBoolean, IsOptional } from 'class-validator';

export class UpdateApiKeyDto {
    @ApiProperty()
    @IsString()
    @IsNotEmpty()
    modelName: string;

    @ApiProperty()
    @IsString()
    @IsNotEmpty()
    apiKey: string;

    @ApiProperty()
    @IsBoolean()
    @IsOptional()
    isEnabled?: Boolean

    constructor(modelName: string, apiKey: string, isEnabled?: Boolean) {
        this.modelName = modelName;
        this.apiKey = apiKey;
        this.isEnabled = isEnabled ?? true
    }
}
