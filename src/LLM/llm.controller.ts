import { Body, Controller, InternalServerErrorException, Put, UseGuards } from "@nestjs/common";
import { ApiTags, ApiOkResponse, ApiBody, ApiBearerAuth } from "@nestjs/swagger";
import { createApiResponseSchema } from "src/ErrorResponse.utils";
import { UpdateApiKeyDto } from "./DTO/UpdateApiKey.dto";
import { LLMService } from "./llm.service";
import { AuthGuard } from "src/Auth/auth.guard";


@Controller('llm')
export class LLMController {
    constructor(private llmService: LLMService) {}

    @ApiTags("LLM")
    @UseGuards(AuthGuard)
    @ApiBody({type: UpdateApiKeyDto})
    @ApiBearerAuth()
    @ApiOkResponse(createApiResponseSchema(200, "Api key updated successfully.", "gpt-3"))
    @Put("/updateApiKey")
    async updateApiKey(@Body() apiKeyDto: UpdateApiKeyDto): Promise<{statusCode: number, message: string, modelName: string}> {
        try {
            let isUpdated = await this.llmService.updateApiKey(apiKeyDto)
            if (isUpdated) {
                return {
                    statusCode: 200,
                    message: "Api key updated successfully.",
                    modelName: apiKeyDto.modelName
                }
            }
            throw new InternalServerErrorException("Failed to updated api key")
        } catch (error) {
            if (error instanceof InternalServerErrorException) {
                throw error
            }
            throw new InternalServerErrorException()
        }
    }
    
}