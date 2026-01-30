export default () => ({
  // Application
  port: parseInt(process.env.PORT ?? '5500', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  serviceName: process.env.SERVICE_NAME || 'novapulse-api',
  apiVersion: process.env.API_VERSION || 'v1',

  // MongoDB
  mongoUri: process.env.MONGO_URI,
  mongoMaxPoolSize: parseInt(process.env.MONGO_MAX_POOL_SIZE ?? '10', 10),
  mongoMinPoolSize: parseInt(process.env.MONGO_MIN_POOL_SIZE ?? '2', 10),
  mongoMaxIdleTimeMS: parseInt(process.env.MONGO_MAX_IDLE_TIME_MS ?? '30000', 10),
  mongoServerSelectionTimeout: parseInt(process.env.MONGO_SERVER_SELECTION_TIMEOUT ?? '5000', 10),
  mongoSocketTimeout: parseInt(process.env.MONGO_SOCKET_TIMEOUT ?? '45000', 10),
  mongoReadPreference: process.env.MONGO_READ_PREFERENCE || 'primaryPreferred',

  // JWT
  jwt: {
    accessSecret: process.env.JWT_ACCESS_SECRET,
    refreshSecret: process.env.JWT_REFRESH_SECRET,
    accessExpire: process.env.ACCESS_TOKEN_EXPIRE,
    refreshExpire: process.env.REFRESH_TOKEN_EXPIRE,
  },

  // Redis
  redis: {
    url: process.env.REDIS_URL || 'redis://localhost:6379',
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT ?? '6379', 10),
    password: process.env.REDIS_PASSWORD,
    db: parseInt(process.env.REDIS_DB ?? '0', 10),
    connectTimeout: parseInt(process.env.REDIS_CONNECT_TIMEOUT ?? '10000', 10),
    maxRetries: parseInt(process.env.REDIS_MAX_RETRIES ?? '10', 10),
  },

  // Logging
  logLevel: process.env.LOG_LEVEL ?? 'info',
  logFileMaxSize: process.env.LOG_FILE_MAX_SIZE || '20m',
  logFileMaxFiles: process.env.LOG_FILE_MAX_FILES || '14d',
  logAuditRetentionDays: parseInt(process.env.LOG_AUDIT_RETENTION_DAYS ?? '90', 10),
  logErrorRetentionDays: parseInt(process.env.LOG_ERROR_RETENTION_DAYS ?? '30', 10),

  // Timeouts
  requestTimeoutMs: parseInt(process.env.REQUEST_TIMEOUT_MS ?? '30000', 10),
  serviceTimeoutMs: parseInt(process.env.SERVICE_TIMEOUT_MS ?? '25000', 10),
  gatewayTimeoutMs: parseInt(process.env.GATEWAY_TIMEOUT_MS ?? '29000', 10),

  // Circuit Breaker
  circuitBreaker: {
    failureThreshold: parseInt(process.env.CIRCUIT_BREAKER_FAILURE_THRESHOLD ?? '5', 10),
    resetTimeoutMs: parseInt(process.env.CIRCUIT_BREAKER_RESET_TIMEOUT_MS ?? '60000', 10),
    monitoringPeriodMs: parseInt(process.env.CIRCUIT_BREAKER_MONITORING_PERIOD_MS ?? '60000', 10),
    halfOpenMaxCalls: parseInt(process.env.CIRCUIT_BREAKER_HALF_OPEN_MAX_CALLS ?? '3', 10),
  },

  // Queue
  queue: {
    concurrency: parseInt(process.env.QUEUE_CONCURRENCY ?? '5', 10),
    retryAttempts: parseInt(process.env.QUEUE_RETRY_ATTEMPTS ?? '3', 10),
    retryDelay: parseInt(process.env.QUEUE_RETRY_DELAY ?? '1000', 10),
  },

  // Rate Limiting
  throttle: {
    ttl: parseInt(process.env.THROTTLE_TTL ?? '60', 10),
    limit: parseInt(process.env.THROTTLE_LIMIT ?? '100', 10),
  },
  rateLimitEnabled: process.env.RATE_LIMIT_ENABLED !== 'false',
  corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:3100',
  allowedOrigins: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3100'],

  // Email
  email: {
    mailtrapHost: process.env.MAILTRAP_HOST,
    mailtrapPort: parseInt(process.env.MAILTRAP_PORT ?? '2525', 10),
    mailtrapUser: process.env.MAILTRAP_USER,
    mailtrapPass: process.env.MAILTRAP_PASS,
    from: process.env.EMAIL_FROM || 'noreply@novapulse.com',
    fromName: process.env.EMAIL_FROM_NAME || 'NovaPulse',
  },

  // AWS
  aws: {
    region: process.env.AWS_REGION || 'us-east-1',
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    cloudWatchLogGroup: process.env.AWS_CLOUDWATCH_LOG_GROUP || 'novapulse-api',
  },

  // SQS
  sqs: {
    queueUrl: process.env.SQS_QUEUE_URL,
    dlqUrl: process.env.SQS_DLQ_URL,
    visibilityTimeout: parseInt(process.env.SQS_VISIBILITY_TIMEOUT ?? '300', 10),
    messageRetentionPeriod: parseInt(process.env.SQS_MESSAGE_RETENTION_PERIOD ?? '345600', 10),
    maxReceiveCount: parseInt(process.env.SQS_MAX_RECEIVE_COUNT ?? '3', 10),
  },

  // S3
  s3: {
    bucket: process.env.AWS_S3_BUCKET,
    region: process.env.AWS_S3_REGION || 'us-east-1',
    accessKeyId: process.env.AWS_S3_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_S3_SECRET_ACCESS_KEY,
    presignedUrlExpiry: parseInt(process.env.S3_PRESIGNED_URL_EXPIRY ?? '3600', 10),
  },

  // Observability
  enableMetrics: process.env.ENABLE_METRICS !== 'false',
  enableTracing: process.env.ENABLE_TRACING !== 'false',
  prometheusPort: parseInt(process.env.PROMETHEUS_PORT ?? '9090', 10),
  otelExporterOtlpEndpoint: process.env.OTEL_EXPORTER_OTLP_ENDPOINT,
  otelServiceName: process.env.OTEL_SERVICE_NAME || 'novapulse-api',

  // Caching
  cache: {
    ttl: parseInt(process.env.CACHE_TTL ?? '3600', 10),
    enabled: process.env.CACHE_ENABLED !== 'false',
    maxSize: parseInt(process.env.CACHE_MAX_SIZE ?? '1000', 10),
  },
  enableHttpCache: process.env.ENABLE_HTTP_CACHE !== 'false',
  etagEnabled: process.env.ETAG_ENABLED !== 'false',

  // Frontend
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:3100',

  // Feature Flags
  features: {
    mfaEnabled: process.env.FEATURE_MFA_ENABLED !== 'false',
    webhooksEnabled: process.env.FEATURE_WEBHOOKS_ENABLED !== 'false',
    analyticsEnabled: process.env.FEATURE_ANALYTICS_ENABLED !== 'false',
    auditLogsEnabled: process.env.FEATURE_AUDIT_LOGS_ENABLED !== 'false',
  },

  // Security
  enableWaf: process.env.ENABLE_WAF !== 'false',
  enableDdosProtection: process.env.ENABLE_DDOS_PROTECTION !== 'false',
  encryptEnvVars: process.env.ENCRYPT_ENV_VARS === 'true',
  kmsKeyId: process.env.KMS_KEY_ID,
  sessionSecret: process.env.SESSION_SECRET || 'your-session-secret-change-in-production',

  // AI Configuration
  ai: {
    openaiApiKey: process.env.OPENAI_API_KEY,
    openaiModel: process.env.OPENAI_MODEL || 'gpt-4o-mini',
    pineconeApiKey: process.env.PINECONE_API_KEY,
    pineconeEnvironment: process.env.PINECONE_ENVIRONMENT || 'us-east-1',
    pineconeIndexName: process.env.PINECONE_INDEX_NAME || 'novapulse',
    embeddingModel: process.env.EMBEDDING_MODEL || 'text-embedding-3-small',
    embeddingDimensions: parseInt(process.env.EMBEDDING_DIMENSIONS ?? '1536', 10),
    chunkSize: parseInt(process.env.AI_CHUNK_SIZE ?? '1000', 10),
    chunkOverlap: parseInt(process.env.AI_CHUNK_OVERLAP ?? '200', 10),
    maxTokens: parseInt(process.env.AI_MAX_TOKENS ?? '500', 10),
    temperature: parseFloat(process.env.AI_TEMPERATURE ?? '0.7'),
    usageLimit: parseInt(process.env.AI_USAGE_LIMIT ?? '1000', 10),
    enableAI: process.env.ENABLE_AI !== 'false',
  },
});
