import * as Joi from 'joi';

export const validationSchema = Joi.object({
  PORT: Joi.number().default(5000),
  NODE_ENV: Joi.string().valid('development', 'production', 'test').default('development'),
  MONGO_URI: Joi.string().required(),
  JWT_ACCESS_SECRET: Joi.string().required(),
  JWT_REFRESH_SECRET: Joi.string().required(),
  ACCESS_TOKEN_EXPIRE: Joi.string().default('15m'),
  REFRESH_TOKEN_EXPIRE: Joi.string().default('7d'),
  LOG_LEVEL: Joi.string().default('info'),
  // Default admin user configuration (optional)
  DEFAULT_ADMIN_EMAIL: Joi.string().email().optional(),
  DEFAULT_ADMIN_PASSWORD: Joi.string().min(6).optional(),
  DEFAULT_ADMIN_NAME: Joi.string().optional(),
  // Mailtrap configuration (optional)
  MAILTRAP_HOST: Joi.string().optional(),
  MAILTRAP_PORT: Joi.number().default(2525),
  MAILTRAP_USER: Joi.string().optional(),
  MAILTRAP_PASS: Joi.string().optional(),
  // Email settings (optional)
  EMAIL_FROM: Joi.string().email().optional(),
  EMAIL_FROM_NAME: Joi.string().optional(),
  FRONTEND_URL: Joi.string().uri().optional(),
  // MongoDB Connection Pooling
  MONGO_MAX_POOL_SIZE: Joi.number().default(10),
  MONGO_MIN_POOL_SIZE: Joi.number().default(2),
  MONGO_MAX_IDLE_TIME_MS: Joi.number().default(30000),
  MONGO_SERVER_SELECTION_TIMEOUT: Joi.number().default(5000),
  MONGO_SOCKET_TIMEOUT: Joi.number().default(45000),
  // Rate Limiting
  THROTTLE_TTL: Joi.number().default(60),
  THROTTLE_LIMIT: Joi.number().default(100),
  // CORS
  ALLOWED_ORIGINS: Joi.string().optional(),
  // Redis (optional)
  REDIS_URL: Joi.string().optional(),
  REDIS_HOST: Joi.string().optional(),
  REDIS_PORT: Joi.number().optional(),
  // Queue Configuration
  QUEUE_CONCURRENCY: Joi.number().default(5),
});
