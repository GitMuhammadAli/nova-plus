import { NodeSDK } from '@opentelemetry/sdk-node';
import { Resource } from '@opentelemetry/resources';
import { SemanticResourceAttributes } from '@opentelemetry/semantic-conventions';
import { HttpInstrumentation } from '@opentelemetry/instrumentation-http';
import { MongooseInstrumentation } from '@opentelemetry/instrumentation-mongoose';
import logger from '../logger/winston.logger';

let sdk: NodeSDK | null = null;

export function initializeTracing(serviceName: string = 'novapulse-api'): void {
  if (sdk) {
    logger.warn('OpenTelemetry SDK already initialized');
    return;
  }

  try {
    const defaultResource = Resource.default();
    const customResource = new Resource({
      [SemanticResourceAttributes.SERVICE_NAME]: serviceName,
      [SemanticResourceAttributes.SERVICE_VERSION]: process.env.npm_package_version || '1.0.0',
      [SemanticResourceAttributes.DEPLOYMENT_ENVIRONMENT]: process.env.NODE_ENV || 'development',
    });
    const resource = defaultResource.merge(customResource);

    sdk = new NodeSDK({
      resource,
      instrumentations: [
        new HttpInstrumentation({
          // Ignore health check endpoints
          ignoreIncomingRequestHook: (req) => {
            const url = req.url || '';
            return url.includes('/health') || url.includes('/metrics');
          },
        }),
        new MongooseInstrumentation(),
      ],
    });

    sdk.start();
    logger.info('OpenTelemetry tracing initialized', { serviceName });
  } catch (error) {
    logger.error('Failed to initialize OpenTelemetry', { error });
  }
}

export function shutdownTracing(): Promise<void> {
  if (sdk) {
    return sdk.shutdown().then(() => {
      logger.info('OpenTelemetry tracing shutdown');
      sdk = null;
    }).catch((error) => {
      logger.error('Error shutting down OpenTelemetry', { error });
      sdk = null;
    });
  }
  return Promise.resolve();
}

