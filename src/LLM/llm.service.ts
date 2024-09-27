import { Injectable, InternalServerErrorException, NotFoundException } from "@nestjs/common";
import { PrismaService } from "src/prisma.service";
import { UpdateApiKeyDto } from "./DTO/UpdateApiKey.dto";

@Injectable()
export class LLMService {
    constructor(private prismaService: PrismaService) {}

    async getModelApiKey(modelName: string): Promise<string> {
        let llmInfo = await this.prismaService.lLMModels.findFirst({
            where: {name: modelName, isEnabled: true}
        })
        
        if (!llmInfo) {
            throw new NotFoundException("LLm not found")
        }
        return llmInfo.apiKey
    }


    async updateApiKey(apiKeyDto: UpdateApiKeyDto): Promise<boolean> {
        let updateApiKey = await this.prismaService.lLMModels.update({
            where: { name: apiKeyDto.modelName },
            data: {apiKey: apiKeyDto.apiKey, isEnabled: apiKeyDto.isEnabled?.valueOf() ?? true}
        })
        
        if (!updateApiKey) {
            throw new InternalServerErrorException("Failed to update Api Key")
        }
        return true
    } 
}