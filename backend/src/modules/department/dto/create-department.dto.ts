import { IsString, IsOptional, IsArray, IsMongoId } from 'class-validator';

export class CreateDepartmentDto {
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsMongoId()
  managerId?: string;

  @IsOptional()
  @IsArray()
  @IsMongoId({ each: true })
  memberIds?: string[];
}
