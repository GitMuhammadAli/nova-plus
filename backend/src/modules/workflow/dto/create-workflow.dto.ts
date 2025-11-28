import { IsString, IsOptional, IsArray, IsEnum, ValidateNested, IsObject } from 'class-validator';
import { Type } from 'class-transformer';
import { WorkflowStatus, TriggerType, ActionType } from '../entities/workflow.entity';

export class WorkflowNodeDto {
  @IsString()
  id: string;

  @IsEnum(['trigger', 'action'])
  type: 'trigger' | 'action';

  @IsOptional()
  @IsEnum(TriggerType)
  triggerType?: TriggerType;

  @IsOptional()
  @IsEnum(ActionType)
  actionType?: ActionType;

  @IsObject()
  config: Record<string, any>;

  @IsObject()
  position: { x: number; y: number };
}

export class ConditionDto {
  @IsString()
  id: string;

  @IsString()
  field: string;

  @IsEnum(['equals', 'not_equals', 'contains', 'not_contains', 'greater_than', 'less_than', 'starts_with', 'ends_with'])
  operator: string;

  @IsString()
  value: string;
}

export class WorkflowConnectionDto {
  @IsString()
  id: string;

  @IsString()
  source: string;

  @IsString()
  target: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ConditionDto)
  conditions?: ConditionDto[];

  @IsOptional()
  @IsEnum(['AND', 'OR'])
  logic?: 'AND' | 'OR';
}

export class CreateWorkflowDto {
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsEnum(WorkflowStatus)
  status?: WorkflowStatus;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => WorkflowNodeDto)
  nodes: WorkflowNodeDto[];

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => WorkflowConnectionDto)
  connections: WorkflowConnectionDto[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];
}

