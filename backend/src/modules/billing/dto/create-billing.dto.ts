import { IsString, IsOptional, IsNumber } from 'class-validator';

export class CreateCheckoutSessionDto {
  @IsString()
  priceId: string;

  @IsOptional()
  @IsString()
  successUrl?: string;

  @IsOptional()
  @IsString()
  cancelUrl?: string;
}

export class UpdateUsageDto {
  @IsString()
  subscriptionItemId: string;

  @IsNumber()
  quantity: number;
}
