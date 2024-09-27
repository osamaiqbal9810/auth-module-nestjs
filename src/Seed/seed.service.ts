// seed.service.ts
import { Injectable } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { LLMModel } from '../LLM/enums/LLMs.enum';

@Injectable()
export class SeedService {
  private prisma = new PrismaClient();

  async seedLLMModels() {
    Object.values(LLMModel).forEach(async (llm) => {
      await this.prisma.lLMModels.upsert({
        where: { name: llm }, // Assuming `name` is unique
        update: {
          apiKey: "ae53395393unb843323234in",
          isEnabled: true,
        },
        create: {
          name: llm,
          apiKey: "78796467487966b323794649",
          isEnabled: true,
        },
      });
      
    })
    console.log('LLM Models have been seeded successfully!');
  }
}
