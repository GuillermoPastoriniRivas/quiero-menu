import { NestFactory } from '@nestjs/core';
import { VersioningType } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import helmet from 'helmet';
import * as Sentry from '@sentry/node';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module.js';
import { GlobalExceptionFilter } from './presentation/filters/global-exception.filter.js';
import { StructuredLogger } from './infrastructure/logging/structured-logger.service.js';

async function bootstrap() {
  const logger = new StructuredLogger();
  const app = await NestFactory.create(AppModule, {
    rawBody: true,
    logger,
  });
  app.use(helmet({ crossOriginResourcePolicy: false }));
  app.setGlobalPrefix('api');
  app.enableVersioning({ type: VersioningType.URI, defaultVersion: '1' });
  app.useGlobalFilters(new GlobalExceptionFilter());

  const config = app.get(ConfigService);

  const sentryDsn = config.get<string>('SENTRY_DSN');
  if (sentryDsn) {
    Sentry.init({
      dsn: sentryDsn,
      environment: config.get<string>('NODE_ENV') ?? 'development',
      tracesSampleRate: 0.1,
    });
    logger.log('Sentry initialized');
  }

  const allowedOrigins = process.env.ALLOWED_ORIGINS
    ? process.env.ALLOWED_ORIGINS.split(',').map((o) => o.trim())
    : ['http://localhost:3000', 'http://localhost:3001'];
  app.enableCors({
    origin: allowedOrigins,
    credentials: true,
    methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: [
      'Content-Type',
      'Authorization',
      'X-Kitchen-Token',
      'X-Delivery-Token',
    ],
    maxAge: 86400,
  });

  const port = config.get<number>('port', 3000);

  const swaggerConfig = new DocumentBuilder()
    .setTitle('quiero.menu — API')
    .setDescription('API del menú digital de quiero.menu (sesión JWT).')
    .setVersion('1.0')
    .addBearerAuth(
      { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
      'JWT',
    )
    .build();
  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('api/docs', app, document, {
    useGlobalPrefix: false,
  });

  await app.listen(port);
  logger.log(`quiero.menu API running on http://localhost:${port}`);
  logger.log(`API prefix: /api`);
}

bootstrap();
