import type { INestApplication } from '@nestjs/common';
import { ValidationPipe } from '@nestjs/common';
import cookieParser from 'cookie-parser';

export function parseCorsOrigins(rawOrigin: string | undefined): string | string[] {
  const fallbackOrigin = 'http://localhost:3001';
  const value = rawOrigin?.trim() || fallbackOrigin;
  const origins = value
    .split(',')
    .map((origin) => origin.trim())
    .filter((origin) => origin.length > 0);
  if (origins.length === 0) {
    return fallbackOrigin;
  }
  return origins.length === 1 ? origins[0] : origins;
}

export function configureNestApp(app: INestApplication): void {
  const corsOrigin = parseCorsOrigins(process.env.CORS_ORIGIN);
  app.use(cookieParser());
  app.setGlobalPrefix('api/v1');
  app.enableCors({
    origin: corsOrigin,
    credentials: true,
    methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Workspace-Id'],
  });
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );
}
