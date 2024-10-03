import { Injectable } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { LLMModel } from 'src/LLM/DTO/LLM.model';


@Injectable()
export class SeedService {
  private prisma = new PrismaClient();

  llmModels: LLMModel[] = [
    {
      vendor: 'Open Api',
      model_name: "GPT 4o",
      model_id: "gpt-4o",
      api_key: "a",
      model_short: "4o",
      enabled: false,
      is_default: false,
    },
    {
      vendor: 'Open Api',
      model_name: "GPT 4o Mini",
      model_id: "gpt-4o-mini",
      api_key: "b",
      model_short: "gpt-4o-mini",
      enabled: false,
      is_default: false,
    },
    {
      vendor: 'Groq',
      model_name: "LLAMA 3 8b",
      model_id: "llama3-8b-8192",
      api_key: "c",
      model_short: "llama3_8b",
      enabled: false,
      is_default: false,
    },
    {
      vendor: 'Groq',
      model_name: "LLAMA 3 70b",
      model_id: "llama3-70b-8192",
      api_key: "d",
      model_short: "llama3_70b",
      enabled: false,
      is_default: false,
    },
    {
      'vendor': 'Gemini',
      model_name: "Gemini 1.5 Flash",
      model_id: "gemini-1.5-flash",
      api_key: "e",
      model_short: "gemini_flash",
      enabled: false,
      is_default: false,
    },
    {
      vendor: 'default',
      model_name: "default",
      model_id: "default",
      api_key: "f",
      model_short: "default",
      enabled: true,
      is_default: true,
    }
  ];

  async seedLLMModels() {
    try {
      for (const llm of this.llmModels) {
        await this.prisma.lLMModels.upsert({
          where: { model_name: llm.model_name }, // Assuming `model_name` is unique in your schema
          update: {
            vendor: llm.vendor,
            model_id: llm.model_id,
            api_key: llm.api_key,
            model_short: llm.model_short,
            enabled: llm.enabled,
            is_default: llm.is_default,
          },
          create: {
            vendor: llm.vendor,
            model_name: llm.model_name,
            model_id: llm.model_id,
            api_key: llm.api_key,
            model_short: llm.model_short,
            enabled: llm.enabled,
            is_default: llm.is_default,
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
