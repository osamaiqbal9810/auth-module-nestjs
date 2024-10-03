import { Injectable } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { LLMModel } from '../LLM/DTO/LLM.model';
import { LLMsEnum } from '../LLM/enums/LLMs.enum';


@Injectable()
export class SeedService {
  private prisma = new PrismaClient();

  llmModels: LLMModel[] = [
    {
      vendor: 'Open AI',
      modelName: "GPT-4o",
      modelId: LLMsEnum.gpt4o,
      apiKey: "",
      modelShort: "gpt-4o",
      enabled: false

    },
    {
      vendor: 'Open AI',
      modelName: "GPT-4o mini",
      modelId: LLMsEnum.gpt4o_mini,
      apiKey: "",
      modelShort: "gpt-4o-mini",
      enabled: false

    },
    {
      vendor: 'Groq',
      modelName: "Llama 3: 8B",
      modelId: LLMsEnum.llama3_8b,
      apiKey: "",
      modelShort: "llama3_8b",
      enabled: false
    },
    {
      vendor: 'Groq',
      modelName: "Llama 3: 70B",
      modelId: LLMsEnum.llama3_70b,
      apiKey: "",
      modelShort: "llama3_70b",
      enabled: false

    },
    {
      vendor: 'Gemini',
      modelName: "Gemini 1.5 Flash",
      modelId: LLMsEnum.gemini1_5flash,
      apiKey: "",
      modelShort: "gemini_flash",
      enabled: false

    },
    {
      vendor: 'default',
      modelName: "default",
      modelId: LLMsEnum.default,
      apiKey: "",
      modelShort: "default",
      enabled: true
    }
  ];

  async seedLLMModels() {
    try {
      for (const llm of this.llmModels) {
        await this.prisma.lLMModels.upsert({
          where: { modelId: llm.modelId }, // Assuming `modelName` is unique in your schema
          update: {
            vendor: llm.vendor,
            modelName: llm.modelName,
            modelShort: llm.modelShort
          },
          create: {
            vendor: llm.vendor,
            modelName: llm.modelName,
            modelId: llm.modelId,
            apiKey: llm.apiKey,
            modelShort: llm.modelShort,
            enabled: llm.enabled,
          },
        });
      }
      console.log('LLM Models have been seeded successfully!');
    } catch (error) {
      console.error('Error seeding LLM models:', error);
    } finally {
      await this.prisma.$disconnect();
    }
  }

}
