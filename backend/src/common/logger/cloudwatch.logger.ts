import { createLogger, format, transports } from 'winston';
import DailyRotateFile from 'winston-daily-rotate-file';
import configuration from '../../config/configuration';

const config = configuration();

/**
 * Enhanced Winston logger with CloudWatch support
 * In production, logs are sent to CloudWatch Logs
 * In development, logs go to console and files
 */
const logger = createLogger({
  level: config.logLevel || 'info',
  format: format.combine(
    format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    format.errors({ stack: true }),
    format.splat(),
    format.json(),
    // Add request context if available
    format((info) => {
      // Add AWS Lambda context if available
      if (process.env.AWS_LAMBDA_FUNCTION_NAME) {
        info.aws = {
          lambda: {
            functionName: process.env.AWS_LAMBDA_FUNCTION_NAME,
            requestId: process.env.AWS_REQUEST_ID,
            region: process.env.AWS_REGION,
          },
        };
      }
      return info;
    })(),
  ),
  defaultMeta: {
    service: process.env.SERVICE_NAME || 'novapulse-api',
    environment: config.nodeEnv || 'development',
  },
  transports: [
    // Console transport (always enabled)
    new transports.Console({
      format: format.combine(
        format.colorize(),
        format.printf(({ timestamp, level, message, ...meta }) => {
          const metaStr = Object.keys(meta).length ? JSON.stringify(meta, null, 2) : '';
          return `${timestamp} [${level}]: ${message} ${metaStr}`;
        }),
      ),
    }),
    // File transport (development/staging)
    new DailyRotateFile({
      filename: 'logs/application-%DATE%.log',
      datePattern: 'YYYY-MM-DD',
      maxSize: process.env.LOG_FILE_MAX_SIZE || '20m',
      maxFiles: process.env.LOG_FILE_MAX_FILES || '14d',
      zippedArchive: true,
      format: format.json(),
    }),
    // Error log file
    new DailyRotateFile({
      filename: 'logs/error-%DATE%.log',
      datePattern: 'YYYY-MM-DD',
      level: 'error',
      maxFiles: process.env.LOG_ERROR_RETENTION_DAYS ? `${process.env.LOG_ERROR_RETENTION_DAYS}d` : '30d',
      zippedArchive: true,
      format: format.json(),
    }),
    // Audit log file (for compliance)
    new DailyRotateFile({
      filename: 'logs/audit-%DATE%.log',
      datePattern: 'YYYY-MM-DD',
      maxFiles: process.env.LOG_AUDIT_RETENTION_DAYS ? `${process.env.LOG_AUDIT_RETENTION_DAYS}d` : '90d',
      zippedArchive: true,
      format: format.json(),
    }),
  ],
  exceptionHandlers: [
    new transports.Console(),
    new DailyRotateFile({ 
      filename: 'logs/exceptions-%DATE%.log',
      maxFiles: '30d',
    }),
  ],
  rejectionHandlers: [
    new transports.Console(),
    new DailyRotateFile({ 
      filename: 'logs/rejections-%DATE%.log',
      maxFiles: '30d',
    }),
  ],
});

/**
 * Structured logging helper with request context
 */
export interface LogContext {
  requestId?: string;
  userId?: string;
  companyId?: string;
  path?: string;
  method?: string;
  responseTime?: number;
  status?: number;
  error?: {
    message: string;
    stack?: string;
    code?: string;
  };
  [key: string]: any;
}

export class StructuredLogger {
  /**
   * Log with structured context
   */
  static log(level: string, message: string, context: LogContext = {}) {
    logger.log(level, message, context);
  }

  /**
   * Log API request
   */
  static logRequest(context: LogContext) {
    logger.info('API Request', {
      type: 'api_request',
      ...context,
    });
  }

  /**
   * Log API response
   */
  static logResponse(context: LogContext) {
    logger.info('API Response', {
      type: 'api_response',
      ...context,
    });
  }

  /**
   * Log slow query
   */
  static logSlowQuery(query: string, duration: number, context: LogContext = {}) {
    logger.warn('Slow Query Detected', {
      type: 'slow_query',
      query,
      duration,
      ...context,
    });
  }

  /**
   * Log error with full context
   */
  static logError(message: string, error: Error, context: LogContext = {}) {
    logger.error(message, {
      type: 'error',
      error: {
        message: error.message,
        stack: error.stack,
        name: error.name,
      },
      ...context,
    });
  }

  /**
   * Log audit event (for compliance)
   */
  static logAudit(action: string, context: LogContext) {
    logger.info('Audit Event', {
      type: 'audit',
      action,
      timestamp: new Date().toISOString(),
      ...context,
    });
  }

  /**
   * Log performance metric
   */
  static logMetric(metric: string, value: number, unit: string = 'ms', context: LogContext = {}) {
    logger.info('Performance Metric', {
      type: 'metric',
      metric,
      value,
      unit,
      ...context,
    });
  }
}

export default logger;

