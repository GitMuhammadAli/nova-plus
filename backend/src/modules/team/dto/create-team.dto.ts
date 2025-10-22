import { IsNotEmpty, IsMongoId, IsOptional, IsString } from 'class-validator';

export class CreateTeamDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsOptional()
  @IsMongoId({ each: true })
  members?: string[];
}
