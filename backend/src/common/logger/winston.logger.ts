import { createLogger, format, transports } from 'winston';
import DailyRotateFile from 'winston-daily-rotate-file';
import configuration from '../../config/configuration';

const config = configuration();

const logger = createLogger({
  level: config.logLevel,
  format: format.combine(
    format.timestamp(),
    format.errors({ stack: true }),
    format.splat(),
    format.json()
  ),
  transports: [
    new transports.Console({
      format: format.combine(format.colorize(), format.simple()),
    }),
    new DailyRotateFile({
      filename: 'logs/application-%DATE%.log',
      datePattern: 'YYYY-MM-DD',
      maxFiles: '14d',
      zippedArchive: true,
    }),
  ],
  exceptionHandlers: [
    new transports.Console(),
    new DailyRotateFile({ filename: 'logs/exceptions-%DATE%.log' }),
  ],
  rejectionHandlers: [
    new transports.Console(),
    new DailyRotateFile({ filename: 'logs/rejections-%DATE%.log' }),
  ],
});

export default logger;
