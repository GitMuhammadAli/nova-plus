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

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);
  
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
  const nodeEnv = configService.get<string>('NODE_ENV') || 'development';
  const allowedOrigins = nodeEnv === 'production'
    ? (configService.get<string>('ALLOWED_ORIGINS')?.split(',') || [])
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
  
  const port = configService.get<number>('port') ?? 5500;
  await app.listen(port);
  logger.info(`🚀 Server started on port ${port} in ${nodeEnv} mode`);
  logger.info(`📝 API available at http://localhost:${port}/api/v1`);
}
bootstrap();
