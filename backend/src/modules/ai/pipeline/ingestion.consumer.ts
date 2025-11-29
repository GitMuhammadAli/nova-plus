import { Injectable, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { EventEmitterService } from '../../../common/events/event-emitter.service';
import { CleanerService } from './cleaner.service';
import { ChunkService } from './chunk.service';
import { EmbeddingService } from './embedding.service';
import { PineconeService } from '../vector/pinecone.service';
import logger from '../../../common/logger/winston.logger';
import { EventType } from '../../../../shared/events/event.schema';

/**
 * Ingestion Consumer
 * Listens to events and ingests data into vector database
 */
@Injectable()
export class IngestionConsumer implements OnModuleInit {
  constructor(
    private readonly configService: ConfigService,
    private readonly cleaner: CleanerService,
    private readonly chunker: ChunkService,
    private readonly embedder: EmbeddingService,
    private readonly pinecone: PineconeService,
    private readonly eventEmitter: EventEmitterService,
  ) {}

  async onModuleInit() {
    // In production, this would subscribe to SQS or EventBridge
    logger.info('AI Ingestion Consumer initialized');
  }

  /**
   * Process entity for ingestion
   */
  async ingestEntity(
    entity: any,
    entityType: string,
    tenantId?: string,
  ): Promise<void> {
    try {
      logger.info('Ingesting entity', { entityType, entityId: entity._id || entity.id });

      // 1. Clean
      const cleaned = this.cleaner.cleanEntity(entity, entityType);

      // 2. Chunk
      const chunks = this.chunker.chunk(cleaned, {
        entityId: entity._id?.toString() || entity.id,
        entityType,
        tenantId,
      });

      // 3. Generate embeddings
      const texts = chunks.map((chunk) => chunk.text);
      const embeddings = await this.embedder.embedBatch(texts);

      // 4. Upsert to Pinecone
      const vectors = chunks.map((chunk, index) => ({
        id: `${entityType}_${chunk.metadata.entityId}_${chunk.metadata.chunkIndex}`,
        values: embeddings[index],
        metadata: {
          text: chunk.text,
          entityId: chunk.metadata.entityId,
          entityType: chunk.metadata.entityType,
          tenantId: chunk.metadata.tenantId,
          chunkIndex: chunk.metadata.chunkIndex,
        },
      }));

      await this.pinecone.upsert(vectors, tenantId);

      logger.info('Entity ingested successfully', {
        entityType,
        entityId: entity._id || entity.id,
        chunks: chunks.length,
      });
    } catch (error) {
      logger.error('Entity ingestion failed', {
        error: error.message,
        entityType,
        entityId: entity._id || entity.id,
      });
      throw error;
    }
  }

  /**
   * Handle user created event
   */
  async handleUserCreated(user: any, tenantId?: string): Promise<void> {
    await this.ingestEntity(user, 'user', tenantId);
  }

  /**
   * Handle department created event
   */
  async handleDepartmentCreated(department: any, tenantId?: string): Promise<void> {
    await this.ingestEntity(department, 'department', tenantId);
  }

  /**
   * Handle task updated event
   */
  async handleTaskUpdated(task: any, tenantId?: string): Promise<void> {
    await this.ingestEntity(task, 'task', tenantId);
  }
}

