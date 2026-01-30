import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';
import logger from '../../../common/logger/winston.logger';

export interface DetectedAction {
  type: string;
  description: string;
  parameters: Record<string, any>;
  confidence: number;
}

/**
 * Manager Agent Service
 * Detects and executes natural language commands
 */
@Injectable()
export class ManagerAgentService {
  private openai: OpenAI;

  constructor(private readonly configService: ConfigService) {
    const apiKey = this.configService.get<string>('OPENAI_API_KEY');
    if (apiKey) {
      this.openai = new OpenAI({ apiKey });
    }
  }

  /**
   * Detect action from natural language
   */
  async detectAction(message: string): Promise<DetectedAction | null> {
    if (!this.openai) {
      return null;
    }

    try {
      const systemPrompt = `You are an action detection system. Analyze user messages and detect if they want to perform an action.

Available actions:
- ASSIGN_DEPARTMENT: Assign user to department
- INVITE_USER: Create and send invite
- DEACTIVATE_USER: Deactivate a user
- CREATE_TASK: Create a new task
- ASSIGN_TASK: Assign task to user
- CREATE_DEPARTMENT: Create department
- ASSIGN_MANAGER: Assign manager to department

Return JSON with:
{
  "action": "ACTION_TYPE" or null,
  "description": "What the user wants to do",
  "parameters": { "key": "value" },
  "confidence": 0.0-1.0
}`;

      const completion = await this.openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: message },
        ],
        response_format: { type: 'json_object' },
        temperature: 0.3,
      });

      const response = JSON.parse(completion.choices[0]?.message?.content || '{}');

      if (response.action && response.confidence > 0.7) {
        return {
          type: response.action,
          description: response.description,
          parameters: response.parameters || {},
          confidence: response.confidence,
        };
      }

      return null;
    } catch (error) {
      logger.error('Action detection failed', { error: error.message });
      return null;
    }
  }

  /**
   * Execute action
   */
  async executeAction(
    action: DetectedAction,
    userId: string,
    context?: { tenantId?: string },
  ): Promise<any> {
    logger.info('Executing action', {
      actionType: action.type,
      userId,
      parameters: action.parameters,
    });

    // In production, this would call appropriate services
    // For now, return placeholder
    return {
      success: true,
      message: `Action ${action.type} would be executed with parameters: ${JSON.stringify(action.parameters)}`,
      action: action.type,
    };
  }

  /**
   * Extract entities from message
   */
  async extractEntities(message: string): Promise<{
    users?: string[];
    departments?: string[];
    tasks?: string[];
  }> {
    // Use NLP to extract entity mentions
    // For now, return empty
    return {};
  }
}

