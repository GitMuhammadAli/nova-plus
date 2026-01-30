/**
 * Shared service configuration types
 */

export interface ServiceConfig {
  name: string;
  port: number;
  environment: string;
  database: {
    mongo?: {
      uri: string;
      options?: Record<string, any>;
    };
    redis?: {
      url: string;
      options?: Record<string, any>;
    };
    postgres?: {
      host: string;
      port: number;
      database: string;
      username: string;
      password: string;
    };
  };
  aws: {
    region: string;
    sqs?: {
      queueUrl: string;
      dlqUrl?: string;
    };
    s3?: {
      bucket: string;
      region: string;
    };
  };
  jwt: {
    secret: string;
    serviceSecret: string; // For inter-service auth
  };
  logging: {
    level: string;
    cloudWatch?: {
      logGroup: string;
      region: string;
    };
  };
  features: {
    [key: string]: boolean;
  };
}

