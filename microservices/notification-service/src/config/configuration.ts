export default () => ({
  port: parseInt(process.env.PORT || '3002', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  serviceName: 'notification-service',

  database: {
    mongo: {
      uri: process.env.MONGO_URI || 'mongodb://localhost:27017/novapulse_notifications',
    },
  },

  aws: {
    region: process.env.AWS_REGION || 'us-east-1',
    sqs: {
      queueUrl: process.env.SQS_QUEUE_URL || '',
      dlqUrl: process.env.SQS_DLQ_URL || '',
      visibilityTimeout: parseInt(process.env.SQS_VISIBILITY_TIMEOUT || '300', 10),
      maxReceiveCount: parseInt(process.env.SQS_MAX_RECEIVE_COUNT || '3', 10),
    },
    ses: {
      region: process.env.AWS_SES_REGION || 'us-east-1',
      accessKeyId: process.env.AWS_SES_ACCESS_KEY_ID,
      secretAccessKey: process.env.AWS_SES_SECRET_ACCESS_KEY,
    },
    sns: {
      region: process.env.AWS_SNS_REGION || 'us-east-1',
    },
  },

  email: {
    provider: process.env.EMAIL_PROVIDER || 'ses', // ses, mailtrap, smtp
    mailtrap: {
      host: process.env.MAILTRAP_HOST,
      port: parseInt(process.env.MAILTRAP_PORT || '2525', 10),
      user: process.env.MAILTRAP_USER,
      pass: process.env.MAILTRAP_PASS,
    },
    from: process.env.EMAIL_FROM || 'noreply@novapulse.com',
    fromName: process.env.EMAIL_FROM_NAME || 'NovaPulse',
  },

  sms: {
    provider: process.env.SMS_PROVIDER || 'sns', // sns, twilio
    twilio: {
      accountSid: process.env.TWILIO_ACCOUNT_SID,
      authToken: process.env.TWILIO_AUTH_TOKEN,
      from: process.env.TWILIO_FROM,
    },
  },

  push: {
    firebase: {
      projectId: process.env.FIREBASE_PROJECT_ID,
      privateKey: process.env.FIREBASE_PRIVATE_KEY,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    },
  },

  logging: {
    level: process.env.LOG_LEVEL || 'info',
  },
});

