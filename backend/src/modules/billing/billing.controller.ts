import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  UseGuards,
  Req,
  Headers,
  RawBodyRequest,
} from '@nestjs/common';
import { BillingService } from './billing.service';
import { CreateCheckoutSessionDto, UpdateUsageDto } from './dto/create-billing.dto';
import { CancelSubscriptionDto } from './dto/update-billing.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '../user/entities/user.entity';
import Stripe from 'stripe';
import { ConfigService } from '@nestjs/config';

@Controller('billing')
export class BillingController {
  constructor(
    private readonly billingService: BillingService,
    private readonly configService: ConfigService,
  ) {}

  /**
   * Create checkout session
   * POST /billing/create-checkout-session
   */
  @Post('create-checkout-session')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.COMPANY_ADMIN, UserRole.SUPER_ADMIN)
  async createCheckoutSession(
    @Body() createCheckoutDto: CreateCheckoutSessionDto,
    @Req() req: any,
  ) {
    const companyId = req.user.companyId?.toString() || req.user.companyId;
    const userId = req.user._id?.toString() || req.user.id;

    if (!companyId) {
      throw new Error('Company ID not found in user session');
    }

    const result = await this.billingService.createCheckoutSession(
      companyId,
      userId,
      createCheckoutDto,
    );

    return {
      success: true,
      data: result,
    };
  }

  /**
   * Get subscription plans
   * GET /billing/plans
   */
  @Get('plans')
  @UseGuards(JwtAuthGuard, RolesGuard)
  async getPlans() {
    const plans = await this.billingService.getPlans();
    return {
      success: true,
      data: plans,
    };
  }

  /**
   * Get company billing info
   * GET /billing/me
   */
  @Get('me')
  @UseGuards(JwtAuthGuard, RolesGuard)
  async getBillingInfo(@Req() req: any) {
    const companyId = req.user.companyId?.toString() || req.user.companyId;
    const billingInfo = await this.billingService.getBillingInfo(companyId);
    return {
      success: true,
      data: billingInfo,
    };
  }

  /**
   * Update usage (metered billing)
   * POST /billing/usage
   */
  @Post('usage')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.COMPANY_ADMIN, UserRole.SUPER_ADMIN)
  async updateUsage(@Body() updateUsageDto: UpdateUsageDto, @Req() req: any) {
    const companyId = req.user.companyId?.toString() || req.user.companyId;
    const userId = req.user._id?.toString() || req.user.id;

    await this.billingService.updateUsage(companyId, updateUsageDto, userId);
    return {
      success: true,
      message: 'Usage updated successfully',
    };
  }

  /**
   * Cancel subscription
   * POST /billing/cancel
   */
  @Post('cancel')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.COMPANY_ADMIN, UserRole.SUPER_ADMIN)
  async cancelSubscription(@Body() cancelDto: CancelSubscriptionDto, @Req() req: any) {
    const companyId = req.user.companyId?.toString() || req.user.companyId;
    const userId = req.user._id?.toString() || req.user.id;

    const subscription = await this.billingService.cancelSubscription(companyId, cancelDto, userId);
    return {
      success: true,
      data: subscription,
    };
  }

  /**
   * Stripe webhook endpoint
   * POST /billing/webhook
   * This endpoint does NOT require authentication (Stripe calls it directly)
   */
  @Post('webhook')
  async handleStripeWebhook(
    @Headers('stripe-signature') signature: string,
    @Req() req: any,
  ) {
    const webhookSecret = this.configService.get<string>('STRIPE_WEBHOOK_SECRET');
    if (!webhookSecret) {
      throw new Error('STRIPE_WEBHOOK_SECRET is not configured');
    }

    const rawBody = req.rawBody;
    if (!rawBody) {
      throw new Error('Raw body is required for webhook verification');
    }

    let event: Stripe.Event;

    try {
      event = Stripe.webhooks.constructEvent(rawBody, signature, webhookSecret);
    } catch (err: any) {
      console.error('Webhook signature verification failed:', err.message);
      throw new Error(`Webhook Error: ${err.message}`);
    }

    // Handle the event
    await this.billingService.handleStripeWebhook(event);

    return {
      success: true,
      received: true,
    };
  }
}
