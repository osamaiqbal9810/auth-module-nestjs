import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "src/prisma.service";
import { UpdateLLMDto } from "./DTO/UpdateLLM.dto";
import { LLMModels } from "@prisma/client";

@Injectable()
export class LLMService {
    constructor(private prismaService: PrismaService) {}

    async getModelApiKey(modelName: string): Promise<string> {
        let llmInfo = await this.prismaService.lLMModels.findFirst({
            where: {model_name: modelName, enabled: true}
        })
        
        if (!llmInfo) {
            throw new NotFoundException("LLm not found")
        }
        return llmInfo.api_key
    }


    async updateLLM(apiKeyDto: UpdateLLMDto): Promise<boolean> {
        let updatedLLM = await this.prismaService.lLMModels.update({
            where: { model_id: apiKeyDto.modelId },
            data: {api_key: apiKeyDto.apiKey, enabled: apiKeyDto.enabled, is_default: apiKeyDto.enabled}
        })

        return !updatedLLM ? false : true
    }

    async getAll(): Promise<LLMModels[]> {
        return await this.prismaService.lLMModels.findMany({})
    }

    async getSupportedLLms(): Promise<LLMModels[]> {
        return await this.prismaService.lLMModels.findMany({where: {enabled: true}})
    }
}