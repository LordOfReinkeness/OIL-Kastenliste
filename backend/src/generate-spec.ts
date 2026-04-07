import { NestFactory } from '@nestjs/core';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { dump } from 'js-yaml';
import { writeFileSync } from 'fs';
import { AppModule } from './app.module';

async function generate() {
  const app = await NestFactory.create(AppModule, { logger: false });
  app.setGlobalPrefix('api');

  const config = new DocumentBuilder()
    .setTitle('Kastenliste OIL')
    .setVersion('1.0')
    .build();

  const document = JSON.parse(JSON.stringify(SwaggerModule.createDocument(app, config)));
  writeFileSync('openapi.yml', dump(document, { indent: 2 }));

  await app.close();
  console.log('openapi.yml generated');
}

generate();
