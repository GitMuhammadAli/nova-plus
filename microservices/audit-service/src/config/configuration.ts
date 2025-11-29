export default () => ({
  port: parseInt(process.env.PORT || '3003', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  serviceName: 'audit-service',

  database: {
    mongo: {
      uri: process.env.MONGO_URI || 'mongodb://localhost:27017/novapulse_audit',
    },
    postgres: {
      host: process.env.POSTGRES_HOST || 'localhost',
      port: parseInt(process.env.POSTGRES_PORT || '5432', 10),
      database: process.env.POSTGRES_DB || 'novapulse_audit_analytics',
      username: process.env.POSTGRES_USER || 'novapulse',
      password: process.env.POSTGRES_PASSWORD || '',
      ssl: process.env.POSTGRES_SSL === 'true',
    },
  },

  aws: {
    region: process.env.AWS_REGION || 'us-east-1',
    sqs: {
      queueUrl: process.env.SQS_QUEUE_URL || '',
      dlqUrl: process.env.SQS_DLQ_URL || '',
    },
  },

  logging: {
    level: process.env.LOG_LEVEL || 'info',
  },
});

