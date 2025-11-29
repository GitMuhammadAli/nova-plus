
export default () => ({
  port: parseInt(process.env.PORT ?? '5000', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  mongoUri: process.env.MONGO_URI,
  jwt: {
    accessSecret: process.env.JWT_ACCESS_SECRET,
    refreshSecret: process.env.JWT_REFRESH_SECRET,
    accessExpire: process.env.ACCESS_TOKEN_EXPIRE,
    refreshExpire: process.env.REFRESH_TOKEN_EXPIRE,
  },
  logLevel: process.env.LOG_LEVEL ?? 'info',
  email: {
    mailtrapHost: process.env.MAILTRAP_HOST,
    mailtrapPort: parseInt(process.env.MAILTRAP_PORT ?? '2525', 10),
    mailtrapUser: process.env.MAILTRAP_USER,
    mailtrapPass: process.env.MAILTRAP_PASS,
    from: process.env.EMAIL_FROM || 'noreply@novapulse.com',
    fromName: process.env.EMAIL_FROM_NAME || 'NovaPulse',
  },
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:3100',
  redis: {
    url: process.env.REDIS_URL || 'redis://localhost:6379',
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT ?? '6379', 10),
  },
  queue: {
    concurrency: parseInt(process.env.QUEUE_CONCURRENCY ?? '5', 10),
  },
});
