import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { Injectable } from '@nestjs/common';
import { IngestionConsumer } from '../../modules/ai/pipeline/ingestion.consumer';
import logger from '../../common/logger/winston.logger';

export interface IngestJobData {
  entity: any;
  entityType: string;
  tenantId?: string;
  action: 'create' | 'update' | 'delete';
}

/**
 * AI Ingestion Worker
 * Processes entities for vector database ingestion
 */
@Processor('ai-ingest')
@Injectable()
export class AIIngestWorker extends WorkerHost {
  constructor(private readonly ingestionConsumer: IngestionConsumer) {
    super();
  }

  async process(job: Job<IngestJobData>): Promise<void> {
    const { entity, entityType, tenantId, action } = job.data;

    try {
      logger.info('Processing ingestion job', {
        jobId: job.id,
        entityType,
        action,
      });

      if (action === 'delete') {
        // Delete from vector database
        await this.ingestionConsumer['pinecone'].deleteByEntity(
          entity._id?.toString() || entity.id,
          entityType,
          tenantId,
        );
      } else {
        // Ingest entity
        await this.ingestionConsumer.ingestEntity(entity, entityType, tenantId);
      }

      logger.info('Ingestion job completed', { jobId: job.id });
    } catch (error) {
      logger.error('Ingestion job failed', {
        jobId: job.id,
        error: error.message,
      });
      throw error;
    }
  }
}
