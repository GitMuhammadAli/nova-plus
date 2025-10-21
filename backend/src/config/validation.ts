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
});
