import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { validateRequiredEnv } from './config/validate-env';
import { configureNestApp } from './configure-nest-app';

async function bootstrap(): Promise<void> {
  validateRequiredEnv();
  const app = await NestFactory.create(AppModule);
  configureNestApp(app);
  const port = Number(process.env.PORT ?? process.env.API_PORT ?? 3000);
  await app.listen(port);
}

bootstrap();
