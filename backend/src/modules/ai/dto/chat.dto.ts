import { IsString, IsOptional, IsArray, IsObject } from 'class-validator';

export class ChatRequestDto {
  @IsString()
  message: string;

  @IsArray()
  @IsOptional()
  history?: Array<{ role: string; content: string }>;

  @IsString()
  @IsOptional()
  tenantId?: string;
}

export class ChatResponseDto {
  type: 'answer' | 'action';
  answer?: string;
  sources?: Array<{
    text: string;
    metadata: any;
    score: number;
  }>;
  action?: {
    type: string;
    description: string;
    parameters?: Record<string, any>;
  };
  result?: any;
}

