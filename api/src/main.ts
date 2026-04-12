import { NestFactory } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import helmet from 'helmet';
import { AppModule } from './app.module.js';
import { GlobalExceptionFilter } from './presentation/filters/global-exception.filter.js';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.use(helmet({ crossOriginResourcePolicy: false }));
  app.setGlobalPrefix('api');
  app.useGlobalFilters(new GlobalExceptionFilter());

  const allowedOrigins = process.env.ALLOWED_ORIGINS
    ? process.env.ALLOWED_ORIGINS.split(',').map((o) => o.trim())
    : ['http://localhost:3000', 'http://localhost:3001'];
  app.enableCors({
    origin: allowedOrigins,
    credentials: true,
    methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Kitchen-Token'],
    maxAge: 86400,
  });

  const config = app.get(ConfigService);
  const port = config.get<number>('port', 3000);

  await app.listen(port);
  console.log(`quiero.menu API running on http://localhost:${port}`);
  console.log(`API prefix: /api`);
}

bootstrap();
