import { IsString, IsOptional, IsNumber, Min, Max } from 'class-validator';

export class SemanticSearchDto {
  @IsString()
  query: string;

  @IsNumber()
  @Min(1)
  @Max(50)
  @IsOptional()
  topK?: number = 5;

  @IsString()
  @IsOptional()
  tenantId?: string;
}

export class SearchResponseDto {
  results: Array<{
    text: string;
    metadata: any;
    score: number;
  }>;
  total: number;
}
