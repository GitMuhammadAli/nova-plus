import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { ConfigService } from '@nestjs/config';
import logger from './common/logger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);

  // Global prefix
  app.setGlobalPrefix('auth');

  // Validation
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );

  // CORS
  const allowedOrigins = configService.get<string>('CORS_ORIGINS')?.split(',') || ['*'];
  app.enableCors({
    origin: allowedOrigins,
    credentials: true,
  });

  // Swagger Documentation
  if (configService.get<string>('NODE_ENV') !== 'production') {
    const config = new DocumentBuilder()
      .setTitle('Auth Service API')
      .setDescription('NovaPulse Authentication Service - Token validation and session management')
      .setVersion('1.0')
      .addBearerAuth()
      .build();
    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('auth/docs', app, document);
  }

  const port = configService.get<number>('PORT', 3001);
  await app.listen(port);

  logger.info(`Auth Service is running on port ${port}`, {
    service: 'auth-service',
    port,
    environment: configService.get<string>('NODE_ENV'),
  });
}

bootstrap();

