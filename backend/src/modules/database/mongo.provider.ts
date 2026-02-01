import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  MongooseModuleOptions,
  MongooseOptionsFactory,
} from '@nestjs/mongoose';
import { connect, connection, Connection } from 'mongoose';
import logger from '../../common/logger/winston.logger';

@Injectable()
export class MongoProvider
  implements MongooseOptionsFactory, OnModuleInit, OnModuleDestroy
{
  private connection: Connection | null = null;

  constructor(private configService: ConfigService) {}

  createMongooseOptions(): MongooseModuleOptions {
    const uri =
      this.configService.get<string>('mongoUri') ||
      'mongodb://localhost:27017/novapulse';
    const maxPoolSize = this.configService.get<number>('mongoMaxPoolSize', 10);
    const minPoolSize = this.configService.get<number>('mongoMinPoolSize', 2);
    const maxIdleTimeMS = this.configService.get<number>(
      'mongoMaxIdleTimeMS',
      30000,
    );
    const serverSelectionTimeoutMS = this.configService.get<number>(
      'mongoServerSelectionTimeout',
      5000,
    );
    const socketTimeoutMS = this.configService.get<number>(
      'mongoSocketTimeout',
      45000,
    );
    const readPreference = this.configService.get<string>(
      'mongoReadPreference',
      'primaryPreferred',
    );

    return {
      uri,
      maxPoolSize,
      minPoolSize,
      maxIdleTimeMS,
      serverSelectionTimeoutMS,
      socketTimeoutMS,
      retryWrites: true,
      retryReads: true,
      readPreference: readPreference as any, // Can switch to secondaryPreferred for read scaling
    };
  }

  async onModuleInit() {
    try {
      const uri =
        this.configService.get<string>('mongoUri') ||
        'mongodb://localhost:27017/novapulse';
      this.connection = connection;

      // Connection event handlers
      this.connection.on('connected', () => {
        logger.info('MongoDB connected successfully', { provider: 'mongo' });
      });

      this.connection.on('error', (error) => {
        logger.error('MongoDB connection error', {
          error: error.message,
          provider: 'mongo',
        });
      });

      this.connection.on('disconnected', () => {
        logger.warn('MongoDB disconnected', { provider: 'mongo' });
      });

      // Monitor connection pool
      this.connection.on('fullsetup', () => {
        logger.info('MongoDB connection pool ready', {
          provider: 'mongo',
          poolSize: this.connection?.readyState,
        });
      });
    } catch (error) {
      logger.error('Failed to initialize MongoDB provider', {
        error: error.message,
      });
      throw error;
    }
  }

  async onModuleDestroy() {
    if (this.connection) {
      await this.connection.close();
      logger.info('MongoDB connection closed', { provider: 'mongo' });
    }
  }

  /**
   * Get connection health status
   */
  getHealthStatus(): { status: string; readyState: number } {
    if (!this.connection) {
      return { status: 'disconnected', readyState: 0 };
    }

    const states = {
      0: 'disconnected',
      1: 'connected',
      2: 'connecting',
      3: 'disconnecting',
    };

    return {
      status:
        states[this.connection.readyState as keyof typeof states] || 'unknown',
      readyState: this.connection.readyState,
    };
  }

  /**
   * Execute a database operation with retry logic
   */
  async executeWithRetry<T>(
    operation: () => Promise<T>,
    maxRetries: number = 3,
    delay: number = 1000,
  ): Promise<T> {
    let lastError: Error;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error as Error;
        logger.warn(
          `MongoDB operation failed (attempt ${attempt}/${maxRetries})`,
          {
            error: error.message,
            attempt,
          },
        );

        if (attempt < maxRetries) {
          await new Promise((resolve) => setTimeout(resolve, delay * attempt));
        }
      }
    }

    throw lastError!;
  }
}
