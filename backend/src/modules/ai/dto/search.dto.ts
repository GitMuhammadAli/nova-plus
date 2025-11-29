import { IsString, IsOptional, IsNumber, Min, Max } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class SemanticSearchDto {
  @ApiProperty({ description: 'Search query' })
  @IsString()
  query: string;

  @ApiProperty({ description: 'Number of results', required: false, default: 5 })
  @IsNumber()
  @Min(1)
  @Max(50)
  @IsOptional()
  topK?: number = 5;

  @ApiProperty({ description: 'Tenant ID for filtering', required: false })
  @IsString()
  @IsOptional()
  tenantId?: string;
}

export class SearchResponseDto {
  @ApiProperty()
  results: Array<{
    text: string;
    metadata: any;
    score: number;
  }>;

  @ApiProperty()
  total: number;
}

