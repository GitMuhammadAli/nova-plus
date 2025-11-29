import { Injectable, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Pinecone } from '@pinecone-database/pinecone';
import logger from '../../../common/logger/winston.logger';

export interface VectorMetadata {
  text: string;
  entityId: string;
  entityType: string;
  tenantId?: string;
  chunkIndex?: number;
  [key: string]: any;
}

export interface Vector {
  id: string;
  values: number[];
  metadata: VectorMetadata;
}

/**
 * Pinecone Vector Database Service
 */
@Injectable()
export class PineconeService implements OnModuleInit {
  private pinecone: Pinecone | null = null;
  private indexName: string;
  private dimension: number = 1536;

  constructor(private readonly configService: ConfigService) {
    this.indexName = this.configService.get<string>('PINECONE_INDEX_NAME', 'novapulse');
  }

  async onModuleInit() {
    const apiKey = this.configService.get<string>('PINECONE_API_KEY');
    const environment = this.configService.get<string>('PINECONE_ENVIRONMENT', 'us-east-1');

    if (apiKey) {
      this.pinecone = new Pinecone({
        apiKey,
      });
      logger.info('Pinecone client initialized', { indexName: this.indexName });
    } else {
      logger.warn('Pinecone API key not configured, vector search will fail');
    }
  }

  /**
   * Upsert vectors to Pinecone
   */
  async upsert(vectors: Vector[], namespace?: string): Promise<void> {
    if (!this.pinecone) {
      throw new Error('Pinecone client not initialized');
    }

    try {
      const index = this.pinecone.index(this.indexName);
      const namespaceIndex = namespace ? index.namespace(namespace) : index;

      // Pinecone supports batch upserts (up to 100 vectors)
      const batchSize = 100;
      for (let i = 0; i < vectors.length; i += batchSize) {
        const batch = vectors.slice(i, i + batchSize);
        await namespaceIndex.upsert(batch);
      }

      logger.debug('Vectors upserted', {
        count: vectors.length,
        namespace: namespace || 'default',
      });
    } catch (error) {
      logger.error('Pinecone upsert failed', { error: error.message });
      throw error;
    }
  }

  /**
   * Semantic search
   */
  async semanticSearch(
    query: string,
    options: {
      topK?: number;
      namespace?: string;
      tenantId?: string;
      filter?: Record<string, any>;
    } = {},
  ): Promise<Array<{ text: string; metadata: VectorMetadata; score: number }>> {
    if (!this.pinecone) {
      throw new Error('Pinecone client not initialized');
    }

    try {
      // Generate query embedding
      const embeddingService = new (await import('../pipeline/embedding.service')).EmbeddingService(
        this.configService,
      );
      const queryEmbedding = await embeddingService.embed(query);

      // Build filter
      const filter: any = {};
      if (options.tenantId) {
        filter.tenantId = options.tenantId;
      }
      if (options.filter) {
        Object.assign(filter, options.filter);
      }

      const index = this.pinecone.index(this.indexName);
      const namespaceIndex = options.namespace
        ? index.namespace(options.namespace)
        : index;

      const queryResponse = await namespaceIndex.query({
        vector: queryEmbedding,
        topK: options.topK || 5,
        includeMetadata: true,
        filter: Object.keys(filter).length > 0 ? filter : undefined,
      });

      return (
        queryResponse.matches?.map((match) => ({
          text: (match.metadata?.text as string) || '',
          metadata: match.metadata as VectorMetadata,
          score: match.score || 0,
        })) || []
      );
    } catch (error) {
      logger.error('Semantic search failed', { error: error.message });
      throw error;
    }
  }

  /**
   * Delete vectors by entity
   */
  async deleteByEntity(entityId: string, entityType: string, namespace?: string): Promise<void> {
    if (!this.pinecone) {
      throw new Error('Pinecone client not initialized');
    }

    try {
      const index = this.pinecone.index(this.indexName);
      const namespaceIndex = namespace ? index.namespace(namespace) : index;

      // Delete all chunks for this entity
      const filter = {
        entityId: { $eq: entityId },
        entityType: { $eq: entityType },
      };

      await namespaceIndex.deleteMany({ filter });
      logger.info('Vectors deleted', { entityId, entityType });
    } catch (error) {
      logger.error('Vector deletion failed', { error: error.message });
      throw error;
    }
  }
}

