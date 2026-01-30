import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
import { ConfigService } from '@nestjs/config';
import logger from './common/logger';
import { SqsConsumerService } from './modules/queue/sqs-consumer.service';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);

  app.setGlobalPrefix('notifications');
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));

  const port = configService.get<number>('PORT', 3002);
  
  // Start SQS consumer
  const sqsConsumer = app.get(SqsConsumerService);
  await sqsConsumer.start();

  await app.listen(port);

  logger.info(`Notification Service is running on port ${port}`, {
    service: 'notification-service',
    port,
  });
}

bootstrap();

