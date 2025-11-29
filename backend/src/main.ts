import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { AllExceptionsFilter } from './common/filters/http-exception.filter';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor';
import { TransformInterceptor } from './common/interceptors/transform.interceptor';
import { RequestIdInterceptor } from './common/interceptors/request-id.interceptor';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import logger from './common/logger/winston.logger';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import compression from 'compression';
import * as tracing from './common/tracing/opentelemetry';

async function bootstrap() {
  // Initialize OpenTelemetry tracing
  const configService = new ConfigService();
  const serviceName = configService.get<string>('SERVICE_NAME') || 'novapulse-api';
  tracing.initializeTracing(serviceName);

  const app = await NestFactory.create(AppModule);
  const appConfigService = app.get(ConfigService);
  
  // Security Headers
  app.use(helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        scriptSrc: ["'self'"],
        imgSrc: ["'self'", 'data:', 'https:'],
      },
    },
    crossOriginEmbedderPolicy: false,
  }));

  // Response Compression
  app.use(compression());

  // Request ID Tracking
  app.useGlobalInterceptors(new RequestIdInterceptor());
  
  // Global Filters & Interceptors
  app.useGlobalFilters(new AllExceptionsFilter());
  app.useGlobalInterceptors(new LoggingInterceptor(), new TransformInterceptor());
  app.useGlobalPipes(new ValidationPipe({ 
    whitelist: true, 
    transform: true,
    forbidNonWhitelisted: true,
    transformOptions: {
      enableImplicitConversion: true,
    },
  }));
  
  app.use(cookieParser());
  
  // CORS - Environment-based configuration
  const nodeEnv = appConfigService.get<string>('NODE_ENV') || 'development';
  const allowedOrigins = nodeEnv === 'production'
    ? (appConfigService.get<string>('ALLOWED_ORIGINS')?.split(',') || [])
    : ['http://localhost:3100', 'http://127.0.0.1:3100'];

  app.enableCors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps, Postman)
      if (!origin) return callback(null, true);
      if (allowedOrigins.includes(origin)) return callback(null, true);
      logger.warn(`CORS blocked for origin: ${origin}`);
      return callback(new Error(`CORS blocked for origin: ${origin}`));
    },
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Cookie', 'X-Request-ID'],
    exposedHeaders: ['Set-Cookie', 'X-Request-ID'],
    credentials: true,
    maxAge: 86400, // 24 hours
  });
  
  // Global API prefix
  app.setGlobalPrefix('api/v1');
  
  const port = appConfigService.get<number>('port') ?? 5500;
  
  // Graceful shutdown
  const gracefulShutdown = async (signal: string) => {
    logger.info(`Received ${signal}, starting graceful shutdown...`);
    
    // Stop accepting new requests
    const server = app.getHttpServer();
    server.close(() => {
      logger.info('HTTP server closed');
    });

    // Shutdown OpenTelemetry
        await tracing.shutdownTracing();
    
    // Close application
    await app.close();
    logger.info('Application closed, exiting...');
    process.exit(0);
  };

  process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
  process.on('SIGINT', () => gracefulShutdown('SIGINT'));

  // Handle unhandled promise rejections
  process.on('unhandledRejection', (reason, promise) => {
    logger.error('Unhandled Rejection', { reason, promise });
  });

  // Handle uncaught exceptions
  process.on('uncaughtException', (error) => {
    logger.error('Uncaught Exception', { error });
    gracefulShutdown('uncaughtException');
  });

  await app.listen(port);
  logger.info(`🚀 Server started on port ${port} in ${nodeEnv} mode`);
  logger.info(`📝 API available at http://localhost:${port}/api/v1`);
  logger.info(`🏥 Health checks available at http://localhost:${port}/api/v1/health`);
}
bootstrap();
