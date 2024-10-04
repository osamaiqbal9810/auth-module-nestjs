import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";
import { UpdateLLMDto } from "./DTO/UpdateLLM.dto";
import { LLMModels } from "@prisma/client";

@Injectable()
export class LLMService {
    constructor(private prismaService: PrismaService) {}

    async getModelApiKey(modelId: string): Promise<string> {
        let llmInfo = await this.prismaService.lLMModels.findFirst({
            where: {modelId: modelId, enabled: true}
        })
        
        if (!llmInfo) {
            throw new NotFoundException("LLm not found")
        }
        return llmInfo.apiKey
    }

// to be used only by Admin
    async updateLLM(llmChangeObj: UpdateLLMDto): Promise<boolean> {
        let updatedLLM = await this.prismaService.lLMModels.update({
            where: { modelId: llmChangeObj.modelId },
            data: {apiKey: llmChangeObj.apiKey, enabled: llmChangeObj.enabled}
        })

        return updatedLLM ? true : false
    }

    // to be used only by Admin
    async getAll(): Promise<LLMModels[]> {
        return await this.prismaService.lLMModels.findMany({})
    }

    async getSupportedLLms(): Promise<Partial<LLMModels>[]> {
        return await this.prismaService.lLMModels.findMany({
            select: {
                modelId: true,
                modelName: true,
                modelShort: true
            },
            where: {enabled: true}})
    }

    async getDefaultLLm(): Promise<Partial<LLMModels> | null> {
        return await this.prismaService.lLMModels.findFirst({
            select: {
                modelId: true,
                modelName: true,
                modelShort: true
            },
            where: { modelId: "default", enabled: true}})
    }
}