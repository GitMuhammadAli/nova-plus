import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PineconeService } from '../vector/pinecone.service';
import { EmbeddingService } from '../pipeline/embedding.service';
import OpenAI from 'openai';
import logger from '../../../common/logger/winston.logger';

export interface RAGResponse {
  answer: string;
  sources: Array<{
    text: string;
    metadata: any;
    score: number;
  }>;
}

/**
 * RAG (Retrieval Augmented Generation) Service
 * Combines vector search with LLM generation
 */
@Injectable()
export class RagService {
  private openai: OpenAI;

  constructor(
    private readonly configService: ConfigService,
    private readonly pinecone: PineconeService,
    private readonly embedder: EmbeddingService,
  ) {
    const apiKey = this.configService.get<string>('OPENAI_API_KEY');
    if (apiKey) {
      this.openai = new OpenAI({ apiKey });
    }
  }

  /**
   * Query with RAG
   */
  async query(
    question: string,
    userId: string,
    options: {
      tenantId?: string;
      topK?: number;
      temperature?: number;
    } = {},
  ): Promise<RAGResponse> {
    try {
      // 1. Semantic search for relevant context
      const searchResults = await this.pinecone.semanticSearch(question, {
        topK: options.topK || 5,
        tenantId: options.tenantId,
      });

      if (searchResults.length === 0) {
        return {
          answer: "I don't have enough data to answer this question yet. Please ensure your company data is properly indexed.",
          sources: [],
        };
      }

      // 2. Build context from search results
      const context = searchResults
        .map((result, index) => `[${index + 1}] ${result.text}`)
        .join('\n\n');

      // 3. Generate answer using LLM
      const systemPrompt = `You are an AI assistant for a company management platform called NovaPulse.
You help users understand their company data, answer questions, and provide insights.

Rules:
- Use ONLY the provided context to answer questions
- If the context doesn't contain the answer, say "I don't have enough data for this yet"
- Be concise and helpful
- Cite sources when relevant (use [1], [2], etc.)
- If asked to perform actions, explain what would need to be done`;

      const userPrompt = `Context:\n${context}\n\nQuestion: ${question}`;

      const completion = await this.openai.chat.completions.create({
        model: this.configService.get<string>('OPENAI_MODEL', 'gpt-4o-mini'),
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        temperature: options.temperature || 0.7,
        max_tokens: 500,
      });

      const answer = completion.choices[0]?.message?.content || 'Unable to generate answer';

      return {
        answer,
        sources: searchResults.map((result) => ({
          text: result.text.substring(0, 200) + '...',
          metadata: result.metadata,
          score: result.score,
        })),
      };
    } catch (error) {
      logger.error('RAG query failed', { error: error.message, question });
      throw error;
    }
  }

  /**
   * Query with company-specific context
   */
  async queryCompany(
    question: string,
    companyId: string,
    userId: string,
  ): Promise<RAGResponse> {
    return this.query(question, userId, {
      tenantId: companyId,
      topK: 10,
    });
  }
}

