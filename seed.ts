// seed.ts
import { NestFactory } from '@nestjs/core';
import { SeedModule } from './src/Seed/seed.module';
import { SeedService } from './src/Seed/seed.service';

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(SeedModule);
  const seedService = app.get(SeedService);

  await seedService.seedLLMModels();

  await app.close();
}

bootstrap()
  .then(() => console.log('Seeding completed'))
  .catch((error) => {
    console.error('Error seeding data', error);
    process.exit(1);
  });
