export default () => ({
  port: parseInt(process.env.PORT || '3004', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  serviceName: 'analytics-service',

  database: {
    mongo: {
      uri: process.env.MONGO_URI || 'mongodb://localhost:27017/novapulse_analytics',
    },
    postgres: {
      host: process.env.POSTGRES_HOST || 'localhost',
      port: parseInt(process.env.POSTGRES_PORT || '5432', 10),
      database: process.env.POSTGRES_DB || 'novapulse_analytics',
      username: process.env.POSTGRES_USER || 'novapulse',
      password: process.env.POSTGRES_PASSWORD || '',
      ssl: process.env.POSTGRES_SSL === 'true',
    },
  },

  aws: {
    region: process.env.AWS_REGION || 'us-east-1',
    eventBridge: {
      ruleName: process.env.EVENTBRIDGE_RULE_NAME || 'analytics-aggregation',
    },
  },

  aggregation: {
    interval: process.env.AGGREGATION_INTERVAL || '1h', // 1h, 1d
    retentionDays: parseInt(process.env.AGGREGATION_RETENTION_DAYS || '90', 10),
  },

  logging: {
    level: process.env.LOG_LEVEL || 'info',
  },
});

