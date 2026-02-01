import { Injectable } from '@nestjs/common';
import logger from '../../../common/logger/winston.logger';

export interface TextChunk {
  text: string;
  metadata: {
    entityId: string;
    entityType: string;
    tenantId?: string;
    chunkIndex: number;
    startIndex: number;
    endIndex: number;
  };
}

/**
 * Text Chunking Service
 * Splits large texts into smaller chunks for embedding
 */
@Injectable()
export class ChunkService {
  private readonly CHUNK_SIZE = 1000; // characters
  private readonly CHUNK_OVERLAP = 200; // characters

  /**
   * Chunk text into smaller pieces
   */
  chunk(
    text: string,
    metadata: {
      entityId: string;
      entityType: string;
      tenantId?: string;
    },
  ): TextChunk[] {
    if (!text || text.length <= this.CHUNK_SIZE) {
      return [
        {
          text: text,
          metadata: {
            ...metadata,
            chunkIndex: 0,
            startIndex: 0,
            endIndex: text.length,
          },
        },
      ];
    }

    const chunks: TextChunk[] = [];
    let startIndex = 0;
    let chunkIndex = 0;

    while (startIndex < text.length) {
      let endIndex = Math.min(startIndex + this.CHUNK_SIZE, text.length);

      // Try to break at sentence boundary
      if (endIndex < text.length) {
        const lastPeriod = text.lastIndexOf('.', endIndex);
        const lastNewline = text.lastIndexOf('\n', endIndex);
        const breakPoint = Math.max(lastPeriod, lastNewline);

        if (breakPoint > startIndex + this.CHUNK_SIZE * 0.5) {
          endIndex = breakPoint + 1;
        }
      }

      const chunkText = text.substring(startIndex, endIndex).trim();

      if (chunkText.length > 0) {
        chunks.push({
          text: chunkText,
          metadata: {
            ...metadata,
            chunkIndex,
            startIndex,
            endIndex,
          },
        });
      }

      // Move start index with overlap
      startIndex = endIndex - this.CHUNK_OVERLAP;
      chunkIndex++;
    }

    logger.debug('Text chunked', {
      originalLength: text.length,
      chunks: chunks.length,
      entityType: metadata.entityType,
    });

    return chunks;
  }

  /**
   * Chunk multiple texts
   */
  chunkBatch(
    texts: Array<{
      text: string;
      metadata: {
        entityId: string;
        entityType: string;
        tenantId?: string;
      };
    }>,
  ): TextChunk[] {
    const allChunks: TextChunk[] = [];

    for (const item of texts) {
      const chunks = this.chunk(item.text, item.metadata);
      allChunks.push(...chunks);
    }

    return allChunks;
  }
}
