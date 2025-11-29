export default () => ({
  port: parseInt(process.env.PORT || '3001', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  serviceName: 'auth-service',

  database: {
    mongo: {
      uri: process.env.MONGO_URI || 'mongodb://localhost:27017/novapulse_auth',
      options: {
        maxPoolSize: parseInt(process.env.MONGO_MAX_POOL_SIZE || '10', 10),
        minPoolSize: parseInt(process.env.MONGO_MIN_POOL_SIZE || '2', 10),
      },
    },
    redis: {
      url: process.env.REDIS_URL || 'redis://localhost:6379',
      options: {
        connectTimeout: parseInt(process.env.REDIS_CONNECT_TIMEOUT || '10000', 10),
        maxRetries: parseInt(process.env.REDIS_MAX_RETRIES || '10', 10),
      },
    },
  },

  jwt: {
    accessSecret: process.env.JWT_ACCESS_SECRET || 'change-me',
    refreshSecret: process.env.JWT_REFRESH_SECRET || 'change-me',
    serviceSecret: process.env.JWT_SERVICE_SECRET || 'change-me-service',
    accessExpire: process.env.ACCESS_TOKEN_EXPIRE || '15m',
    refreshExpire: process.env.REFRESH_TOKEN_EXPIRE || '7d',
  },

  cors: {
    origins: process.env.CORS_ORIGINS?.split(',') || ['http://localhost:3100'],
  },

  logging: {
    level: process.env.LOG_LEVEL || 'info',
    cloudWatch: {
      logGroup: process.env.AWS_CLOUDWATCH_LOG_GROUP || 'auth-service',
      region: process.env.AWS_REGION || 'us-east-1',
    },
  },
});

