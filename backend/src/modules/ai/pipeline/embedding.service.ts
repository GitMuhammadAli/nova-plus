import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';
import logger from '../../../common/logger/winston.logger';

/**
 * Embedding Service
 * Generates vector embeddings using OpenAI
 */
@Injectable()
export class EmbeddingService {
  private openai: OpenAI;
  private readonly model = 'text-embedding-3-small'; // or text-embedding-ada-002

  constructor(private readonly configService: ConfigService) {
    const apiKey = this.configService.get<string>('OPENAI_API_KEY');
    if (apiKey) {
      this.openai = new OpenAI({ apiKey });
    } else {
      logger.warn('OpenAI API key not configured, embeddings will fail');
    }
  }

  /**
   * Generate embedding for a single text
   */
  async embed(text: string): Promise<number[]> {
    if (!this.openai) {
      throw new Error('OpenAI client not initialized');
    }

    try {
      const response = await this.openai.embeddings.create({
        model: this.model,
        input: text,
      });

      return response.data[0].embedding;
    } catch (error) {
      logger.error('Embedding generation failed', {
        error: error.message,
        textLength: text.length,
      });
      throw error;
    }
  }

  /**
   * Generate embeddings for multiple texts (batch)
   */
  async embedBatch(texts: string[]): Promise<number[][]> {
    if (!this.openai) {
      throw new Error('OpenAI client not initialized');
    }

    if (texts.length === 0) {
      return [];
    }

    try {
      const response = await this.openai.embeddings.create({
        model: this.model,
        input: texts,
      });

      return response.data.map((item) => item.embedding);
    } catch (error) {
      logger.error('Batch embedding generation failed', {
        error: error.message,
        batchSize: texts.length,
      });
      throw error;
    }
  }

  /**
   * Get embedding dimensions
   */
  getDimensions(): number {
    // text-embedding-3-small: 1536 dimensions
    // text-embedding-ada-002: 1536 dimensions
    return 1536;
  }
}
