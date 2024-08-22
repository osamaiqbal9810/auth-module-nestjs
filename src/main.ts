import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { ValidationPipe } from '@nestjs/common';
import {  config }  from 'dotenv';

config() // for populating process.env
async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const config = new DocumentBuilder()
    .setTitle("Baseline Server")
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document, {
    swaggerOptions: { defaultModelsExpandDepth: -1 }
  });
  app.useGlobalPipes(new ValidationPipe()) // schema validation
  //app.use('/files/upload', (req, res, next) => new ProgressMiddleware().use(req, res, next));
  await app.listen(3000);
}

bootstrap();
