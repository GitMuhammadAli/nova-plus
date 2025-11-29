import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { RagService } from './rag.service';
import { ManagerAgentService } from '../agents/manager-agent.service';
import logger from '../../../common/logger/winston.logger';

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface ChatResponse {
  type: 'answer' | 'action';
  answer?: string;
  sources?: Array<{ text: string; metadata: any; score: number }>;
  action?: {
    type: string;
    description: string;
    parameters?: Record<string, any>;
  };
  result?: any;
}

/**
 * AI Assistant Service
 * Main chat interface combining RAG with agent actions
 */
@Injectable()
export class AIAssistantService {
  constructor(
    private readonly configService: ConfigService,
    private readonly rag: RagService,
    private readonly managerAgent: ManagerAgentService,
  ) {}

  /**
   * Chat with AI assistant
   */
  async chat(
    message: string,
    userId: string,
    options: {
      tenantId?: string;
      conversationHistory?: ChatMessage[];
    } = {},
  ): Promise<ChatResponse> {
    try {
      // 1. Check if message requires action
      const action = await this.managerAgent.detectAction(message);

      if (action) {
        logger.info('Action detected in chat', {
          actionType: action.type,
          userId,
        });

        // Execute action if user confirms (in real implementation)
        // For now, return action suggestion
        return {
          type: 'action',
          action: {
            type: action.type,
            description: action.description,
            parameters: action.parameters,
          },
          answer: `I can help you with: ${action.description}. Would you like me to proceed?`,
        };
      }

      // 2. Use RAG for answer
      const ragResponse = await this.rag.query(message, userId, {
        tenantId: options.tenantId,
      });

      return {
        type: 'answer',
        answer: ragResponse.answer,
        sources: ragResponse.sources,
      };
    } catch (error) {
      logger.error('AI chat failed', { error: error.message, userId });
      return {
        type: 'answer',
        answer: 'I apologize, but I encountered an error processing your request. Please try again.',
        sources: [],
      };
    }
  }

  /**
   * Generate summary
   */
  async generateSummary(
    type: 'daily' | 'weekly' | 'department',
    tenantId: string,
    options?: { departmentId?: string },
  ): Promise<string> {
    const prompt = this.getSummaryPrompt(type, options);

    const ragResponse = await this.rag.queryCompany(prompt, tenantId, 'system');

    return ragResponse.answer;
  }

  private getSummaryPrompt(
    type: 'daily' | 'weekly' | 'department',
    options?: { departmentId?: string },
  ): string {
    switch (type) {
      case 'daily':
        return 'Generate a daily summary of company activity, including new users, completed tasks, and important updates.';
      case 'weekly':
        return 'Generate a weekly summary with trends, department performance, and key metrics.';
      case 'department':
        return `Generate a summary for department ${options?.departmentId} including team activity, task completion, and performance metrics.`;
      default:
        return 'Generate a summary of recent activity.';
    }
  }
}

