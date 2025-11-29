import { IsString, IsOptional, IsArray, IsObject } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ChatRequestDto {
  @ApiProperty({ description: 'User message' })
  @IsString()
  message: string;

  @ApiProperty({ description: 'Conversation history', required: false })
  @IsArray()
  @IsOptional()
  history?: Array<{ role: string; content: string }>;

  @ApiProperty({ description: 'Tenant ID', required: false })
  @IsString()
  @IsOptional()
  tenantId?: string;
}

export class ChatResponseDto {
  @ApiProperty()
  type: 'answer' | 'action';

  @ApiProperty({ required: false })
  answer?: string;

  @ApiProperty({ required: false })
  sources?: Array<{
    text: string;
    metadata: any;
    score: number;
  }>;

  @ApiProperty({ required: false })
  action?: {
    type: string;
    description: string;
    parameters?: Record<string, any>;
  };

  @ApiProperty({ required: false })
  result?: any;
}

