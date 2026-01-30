import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
import { ConfigService } from '@nestjs/config';
import logger from './common/logger';
import { SqsConsumerService } from './modules/queue/sqs-consumer.service';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);

  app.setGlobalPrefix('audit');
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));

  // Start SQS consumer
  const sqsConsumer = app.get(SqsConsumerService);
  await sqsConsumer.start();

  const port = configService.get<number>('PORT', 3003);
  await app.listen(port);

  logger.info(`Audit Service is running on port ${port}`, {
    service: 'audit-service',
    port,
  });
}

bootstrap();

