import { IsMongoId, IsOptional, IsString } from 'class-validator';

export class CreateTaskDto {
  @IsString()
  title: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsMongoId()
  assignedTo: string;

  @IsOptional()
  @IsMongoId()
  team?: string;
}
