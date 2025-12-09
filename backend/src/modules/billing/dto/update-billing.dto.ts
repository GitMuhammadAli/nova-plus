import { IsOptional, IsBoolean } from 'class-validator';

export class CancelSubscriptionDto {
  @IsOptional()
  @IsBoolean()
  immediately?: boolean; // If true, cancel immediately; if false, cancel at period end
}
