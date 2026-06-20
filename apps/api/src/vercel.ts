import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { ExpressAdapter } from '@nestjs/platform-express';
import express from 'express';
import type { Express } from 'express';
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { AppModule } from './app.module';
import { configureNestApp } from './configure-nest-app';

let cachedServer: Express | null = null;

async function createServer(): Promise<Express> {
  const expressApp = express();
  const app = await NestFactory.create(AppModule, new ExpressAdapter(expressApp));
  configureNestApp(app);
  await app.init();
  return expressApp;
}

export default async function handler(
  request: VercelRequest,
  response: VercelResponse,
): Promise<void> {
  if (!cachedServer) {
    cachedServer = await createServer();
  }
  cachedServer(request, response);
}
