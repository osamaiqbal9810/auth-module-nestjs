import { Body, Controller, Get, InternalServerErrorException, Put, UseGuards } from "@nestjs/common";
import { ApiTags, ApiOkResponse, ApiBody, ApiBearerAuth, getSchemaPath, ApiExtraModels } from "@nestjs/swagger";
import { createApiResponseSchema } from "src/ErrorResponse.utils";
import { LLMService } from "./llm.service";
import { AuthGuard } from "src/Auth/auth.guard";
import { UpdateLLMDto } from "./DTO/UpdateLLM.dto";
import { LLMModels } from "@prisma/client";
import { LLMModel } from "./DTO/LLM.model";
import { RolesGuard } from "src/User/roles.guard";
import { Roles } from "src/User/roles.decorator";
import { Role } from "src/User/enums/Role.enum";


@Controller('llm')
export class LLMController {
    constructor(private llmService: LLMService) {}

    @ApiTags("LLM")
    @UseGuards(AuthGuard, RolesGuard)
    @Roles(Role.Admin)
    @ApiBody({type: UpdateLLMDto})
    @ApiBearerAuth()
    @ApiOkResponse(createApiResponseSchema(200, "LLM  updated successfully.", ""))
    @Put("/")
    async updateLLM(@Body() updatedLLM: UpdateLLMDto): Promise<{statusCode: number, message: string}> {
        try {
            let isUpdated = await this.llmService.updateLLM(updatedLLM)
            if (isUpdated) {
                return {
                    statusCode: 200,
                    message: "LLM updated successfully."
                }
            }
            throw new InternalServerErrorException("Failed to update LLM")
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
                data: {
                    type: 'array',
                    items: { $ref: getSchemaPath(LLMModel) },
                },
            },
        },
    })
    @Get("/")
    async getAllLLMModels(): Promise<{statusCode: number, message: string, data: LLMModels[]}> {
        try {
            let allLLMs = await this.llmService.getAll()
            if (allLLMs) {
                return {
                    statusCode: 200,
                    message: "All LLMs fetched successfully.",
                    data: allLLMs
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

    @Get('/displayOptions')
    @ApiExtraModels(LLMModel)
    @UseGuards(AuthGuard)
    @ApiBearerAuth()
    @ApiOkResponse({
        schema: {
            type: 'object',
            properties: {
                statusCode: { type: 'number', example: 200 },
                message: { type: 'string', example: 'LLM options fetched successfully.' },
                data: {
                    type: 'array',
                    items: {
                        type: 'object',
                        properties: {
                            modelName: { type: 'string', example: 'GPT-3' },
                            modelShort: { type: 'string', example: 'gpt3' },
                            modelId: { type: 'string', example: 'gpt-1234' }
                        }
                    },
                },
            },
        },
    })
    
    @ApiTags("LLM")
    async getSupportedLlmModels(): Promise<{statusCode: number, message: string, data: Partial<LLMModels>[]}> {
        try {
            let supportedLlms = await this.llmService.getSupportedLLms()
            if (supportedLlms) {
                return {
                    statusCode: 200,
                    message: "LLM options fetched successfully.",
                    data: supportedLlms
                }
            }
            throw new InternalServerErrorException("Failed to fetch LLM options")
        } catch (error) {
            if (error instanceof InternalServerErrorException) {
                throw error
            }
            throw new InternalServerErrorException()
        }
    }
}