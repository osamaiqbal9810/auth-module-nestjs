import { Body, Controller, Get, InternalServerErrorException, Put, UseGuards } from "@nestjs/common";
import { ApiTags, ApiOkResponse, ApiBody, ApiBearerAuth, getSchemaPath, ApiExtraModels } from "@nestjs/swagger";
import { createApiResponseSchema } from "src/ErrorResponse.utils";
import { LLMService } from "./llm.service";
import { AuthGuard } from "src/Auth/auth.guard";
import { UpdateLLMDto } from "./DTO/UpdateLLM.dto";
import { LLMModels } from "@prisma/client";
import { LLMModel } from "./DTO/LLM.model";
import { RolesGuard } from "src/User/roles.guard";
import { Roles } from "src/roles.decorator";
import { Role } from "src/User/enums/Role.enum";


@Controller('llm')
export class LLMController {
    constructor(private llmService: LLMService) {}

    @ApiTags("LLM")
    @UseGuards(AuthGuard, RolesGuard)
    @Roles(Role.Admin)
    @ApiBody({type: UpdateLLMDto})
    @ApiBearerAuth()
    @ApiOkResponse(createApiResponseSchema(200, "LLM  updated successfully.", "gpt-3"))
    @Put("/")
    async updateLLM(@Body() apiKeyDto: UpdateLLMDto): Promise<{statusCode: number, message: string, modelName: string}> {
        try {
            let isUpdated = await this.llmService.updateLLM(apiKeyDto)
            if (isUpdated) {
                return {
                    statusCode: 200,
                    message: "LLM updated successfully.",
                    modelName: apiKeyDto.modelId
                }
            }
            throw new InternalServerErrorException("Failed to updated LLM")
        } catch (error) {
            if (error instanceof InternalServerErrorException) {
                throw error
            }
            throw new InternalServerErrorException()
        }
    }
    
    @ApiTags("LLM")
    @ApiExtraModels(LLMModel)
    @UseGuards(AuthGuard, RolesGuard)
    @Roles(Role.Admin)
    @ApiBearerAuth()
    @ApiOkResponse({
        schema: {
            type: 'object',
            properties: {
                statusCode:{type: 'number', example: 200},
                message: { type: 'string', example: 'LLMs fetched successfully.' },
                llms_list: {
                    type: 'array',
                    items: { $ref: getSchemaPath(LLMModel) },
                },
            },
        },
    })
    @Get("/")
    async getAllLLMModels(): Promise<{statusCode: number, message: string, llms_list: LLMModels[]}> {
        try {
            let allLLMs = await this.llmService.getAll()
            if (allLLMs) {
                return {
                    statusCode: 200,
                    message: "All LLMs fetched successfully.",
                    llms_list: allLLMs
                }
            }
            throw new InternalServerErrorException("Failed to fetch LLMs")
        } catch (error) {
            if (error instanceof InternalServerErrorException) {
                throw error
            }
            throw new InternalServerErrorException()
        }
    }

    @Get('/getSupportedLlmOptions')
    @ApiExtraModels(LLMModel)
    @UseGuards(AuthGuard)
    @ApiBearerAuth()
    @ApiOkResponse({
        schema: {
            type: 'object',
            properties: {
                statusCode:{type: 'number', example: 200},
                message: { type: 'string', example: 'LLMs fetched successfully.' },
                llms_list: {
                    type: 'array',
                    items: { $ref: getSchemaPath(LLMModel) },
                },
            },
        },
    })
    @ApiTags("LLM")
    async getSupportedLlmModels(): Promise<{statusCode: number, message: string, llms_list: LLMModels[]}> {
        try {
            let allLLMs = await this.llmService.getSupportedLLms()
            if (allLLMs) {
                return {
                    statusCode: 200,
                    message: "Supported LLMs fetched successfully.",
                    llms_list: allLLMs
                }
            }
            throw new InternalServerErrorException("Failed to fetch LLMs")
        } catch (error) {
            if (error instanceof InternalServerErrorException) {
                throw error
            }
            throw new InternalServerErrorException()
        }
    }
}