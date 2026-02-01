import {
  Injectable,
  BadRequestException,
  NotFoundException,
  InternalServerErrorException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { ConfigService } from '@nestjs/config';
import Stripe from 'stripe';
import { Subscription, SubscriptionDocument } from './entities/billing.entity';
import { Invoice, InvoiceDocument } from './entities/billing.entity';
import {
  CreateCheckoutSessionDto,
  UpdateUsageDto,
} from './dto/create-billing.dto';
import { CancelSubscriptionDto } from './dto/update-billing.dto';
import { AuditService } from '../audit/audit.service';
import { AuditAction, AuditResource } from '../audit/entities/audit-log.entity';

@Injectable()
export class BillingService {
  private stripe: Stripe;

  constructor(
    @InjectModel(Subscription.name)
    private subscriptionModel: Model<SubscriptionDocument>,
    @InjectModel(Invoice.name) private invoiceModel: Model<InvoiceDocument>,
    private configService: ConfigService,
    private auditService: AuditService,
  ) {
    const stripeSecretKey = this.configService.get<string>('STRIPE_SECRET_KEY');
    if (!stripeSecretKey) {
      throw new Error('STRIPE_SECRET_KEY is not configured');
    }
    this.stripe = new Stripe(stripeSecretKey, {
      apiVersion: '2026-01-28.clover' as any,
    });
  }

  /**
   * Create Stripe Checkout Session
   */
  async createCheckoutSession(
    companyId: string,
    userId: string,
    createCheckoutDto: CreateCheckoutSessionDto,
  ): Promise<{ sessionId: string; url: string }> {
    try {
      // Get or create Stripe customer
      const customerId = await this.getOrCreateStripeCustomer(companyId);

      const frontendUrl =
        this.configService.get<string>('FRONTEND_URL') ||
        'http://localhost:3100';
      const successUrl =
        createCheckoutDto.successUrl ||
        `${frontendUrl}/billing/success?session_id={CHECKOUT_SESSION_ID}`;
      const cancelUrl =
        createCheckoutDto.cancelUrl || `${frontendUrl}/billing/cancel`;

      const session = await this.stripe.checkout.sessions.create({
        customer: customerId,
        mode: 'subscription',
        line_items: [
          {
            price: createCheckoutDto.priceId,
            quantity: 1,
          },
        ],
        success_url: successUrl,
        cancel_url: cancelUrl,
        metadata: {
          companyId,
          userId,
        },
      });

      // Audit log
      await this.auditService.createLog({
        action: AuditAction.CREATE,
        resource: AuditResource.SETTINGS,
        resourceId: session.id,
        userId,
        companyId,
        metadata: {
          priceId: createCheckoutDto.priceId,
        },
      });

      return {
        sessionId: session.id,
        url: session.url || '',
      };
    } catch (error: any) {
      throw new BadRequestException(
        `Failed to create checkout session: ${error.message}`,
      );
    }
  }

  /**
   * Get or create Stripe customer
   */
  private async getOrCreateStripeCustomer(companyId: string): Promise<string> {
    // Check if subscription exists with customer ID
    const subscription = await this.subscriptionModel
      .findOne({ companyId: new Types.ObjectId(companyId) })
      .exec();

    if (subscription?.stripeCustomerId) {
      return subscription.stripeCustomerId;
    }

    // Create new customer
    const customer = await this.stripe.customers.create({
      metadata: {
        companyId,
      },
    });

    return customer.id;
  }

  /**
   * Get subscription plans
   */
  async getPlans(): Promise<any[]> {
    try {
      const prices = await this.stripe.prices.list({
        active: true,
        type: 'recurring',
        expand: ['data.product'],
      });

      return prices.data.map((price) => ({
        id: price.id,
        amount: price.unit_amount,
        currency: price.currency,
        interval: price.recurring?.interval,
        intervalCount: price.recurring?.interval_count,
        product: price.product,
      }));
    } catch (error: any) {
      throw new InternalServerErrorException(
        `Failed to fetch plans: ${error.message}`,
      );
    }
  }

  /**
   * Get company subscription
   */
  async getSubscription(
    companyId: string,
  ): Promise<SubscriptionDocument | null> {
    return this.subscriptionModel
      .findOne({ companyId: new Types.ObjectId(companyId) })
      .exec();
  }

  /**
   * Get company billing info
   */
  async getBillingInfo(companyId: string): Promise<{
    subscription: SubscriptionDocument | null;
    invoices: InvoiceDocument[];
    customerId?: string;
  }> {
    const subscription = await this.getSubscription(companyId);
    const invoices = await this.invoiceModel
      .find({ companyId: new Types.ObjectId(companyId) })
      .sort({ createdAt: -1 })
      .limit(10)
      .exec();

    return {
      subscription,
      invoices,
      customerId: subscription?.stripeCustomerId,
    };
  }

  /**
   * Update usage (for metered billing)
   */
  async updateUsage(
    companyId: string,
    updateUsageDto: UpdateUsageDto,
    userId: string,
  ): Promise<void> {
    const subscription = await this.getSubscription(companyId);
    if (!subscription) {
      throw new NotFoundException('No active subscription found');
    }

    try {
      const subscriptionItem = this.stripe.subscriptionItems;
      await (subscriptionItem as any).createUsageRecord(
        updateUsageDto.subscriptionItemId,
        {
          quantity: updateUsageDto.quantity,
          timestamp: Math.floor(Date.now() / 1000),
        },
      );

      // Audit log
      await this.auditService.createLog({
        action: AuditAction.UPDATE,
        resource: AuditResource.SETTINGS,
        resourceId:
          (subscription._id as any)?.toString() || String(subscription._id),
        userId,
        companyId,
        metadata: updateUsageDto,
      });
    } catch (error: any) {
      throw new BadRequestException(`Failed to update usage: ${error.message}`);
    }
  }

  /**
   * Cancel subscription
   */
  async cancelSubscription(
    companyId: string,
    cancelDto: CancelSubscriptionDto,
    userId: string,
  ): Promise<SubscriptionDocument> {
    const subscription = await this.getSubscription(companyId);
    if (!subscription) {
      throw new NotFoundException('No active subscription found');
    }

    try {
      if (cancelDto.immediately) {
        // Cancel immediately
        await this.stripe.subscriptions.cancel(
          subscription.stripeSubscriptionId,
        );
        subscription.status = 'canceled';
        subscription.canceledAt = new Date();
      } else {
        // Cancel at period end
        await this.stripe.subscriptions.update(
          subscription.stripeSubscriptionId,
          {
            cancel_at_period_end: true,
          },
        );
        subscription.cancelAtPeriodEnd = true;
      }

      const updated = await subscription.save();

      // Audit log
      await this.auditService.createLog({
        action: AuditAction.DELETE,
        resource: AuditResource.SETTINGS,
        resourceId:
          (subscription._id as any)?.toString() || String(subscription._id),
        userId,
        companyId,
        metadata: { immediately: cancelDto.immediately },
      });

      return updated;
    } catch (error: any) {
      throw new BadRequestException(
        `Failed to cancel subscription: ${error.message}`,
      );
    }
  }

  /**
   * Handle Stripe webhook events
   */
  async handleStripeWebhook(event: Stripe.Event): Promise<void> {
    switch (event.type) {
      case 'checkout.session.completed':
        await this.handleCheckoutSessionCompleted(event.data.object);
        break;

      case 'customer.subscription.created':
      case 'customer.subscription.updated':
        await this.handleSubscriptionUpdated(event.data.object);
        break;

      case 'customer.subscription.deleted':
        await this.handleSubscriptionDeleted(event.data.object);
        break;

      case 'invoice.paid':
        await this.handleInvoicePaid(event.data.object);
        break;

      case 'invoice.payment_failed':
        await this.handleInvoicePaymentFailed(event.data.object);
        break;

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }
  }

  /**
   * Handle checkout session completed
   */
  private async handleCheckoutSessionCompleted(
    session: Stripe.Checkout.Session,
  ): Promise<void> {
    const companyId = session.metadata?.companyId;
    if (!companyId) {
      console.error('No companyId in checkout session metadata');
      return;
    }

    // Subscription will be created via subscription.created webhook
    // This is just for logging
    console.log('Checkout session completed', {
      sessionId: session.id,
      companyId,
    });
  }

  /**
   * Handle subscription created/updated
   */
  private async handleSubscriptionUpdated(
    subscription: Stripe.Subscription,
  ): Promise<void> {
    let companyId: string | undefined = subscription.metadata?.companyId;
    if (!companyId) {
      // Try to find by customer ID
      const existing = await this.subscriptionModel
        .findOne({ stripeCustomerId: subscription.customer as string })
        .exec();
      if (!existing) {
        console.error('Cannot find company for subscription', subscription.id);
        return;
      }
      companyId = existing.companyId.toString();
    }

    const price = subscription.items.data[0]?.price;
    const product = price?.product as Stripe.Product;

    await this.subscriptionModel
      .findOneAndUpdate(
        { stripeSubscriptionId: subscription.id },
        {
          companyId: new Types.ObjectId(companyId),
          stripeSubscriptionId: subscription.id,
          stripeCustomerId: subscription.customer as string,
          status: subscription.status,
          planId: price?.id || '',
          planName: product?.name || '',
          currentPeriodStart: new Date(
            (subscription as any).current_period_start * 1000,
          ),
          currentPeriodEnd: new Date(
            (subscription as any).current_period_end * 1000,
          ),
          cancelAtPeriodEnd: subscription.cancel_at_period_end,
          canceledAt: subscription.canceled_at
            ? new Date(subscription.canceled_at * 1000)
            : undefined,
          metadata: subscription.metadata,
        },
        { upsert: true, new: true },
      )
      .exec();
  }

  /**
   * Handle subscription deleted
   */
  private async handleSubscriptionDeleted(
    subscription: Stripe.Subscription,
  ): Promise<void> {
    await this.subscriptionModel
      .findOneAndUpdate(
        { stripeSubscriptionId: subscription.id },
        {
          status: 'canceled',
          canceledAt: new Date(),
        },
      )
      .exec();
  }

  /**
   * Handle invoice paid
   */
  private async handleInvoicePaid(invoice: Stripe.Invoice): Promise<void> {
    const invoiceAny = invoice as any;
    const subscriptionId =
      typeof invoiceAny.subscription === 'string'
        ? invoiceAny.subscription
        : invoiceAny.subscription?.id || String(invoiceAny.subscription || '');

    const subscription = await this.subscriptionModel
      .findOne({ stripeSubscriptionId: subscriptionId })
      .exec();

    if (!subscription) {
      console.error('Subscription not found for invoice', invoice.id);
      return;
    }

    await this.invoiceModel
      .findOneAndUpdate(
        { stripeInvoiceId: invoice.id },
        {
          companyId: subscription.companyId,
          stripeInvoiceId: invoice.id,
          stripeSubscriptionId: subscriptionId,
          amount: invoice.amount_paid,
          currency: invoice.currency,
          status: invoice.status || 'paid',
          paidAt: invoice.status_transitions?.paid_at
            ? new Date(invoice.status_transitions.paid_at * 1000)
            : new Date(),
          dueDate: invoice.due_date
            ? new Date(invoice.due_date * 1000)
            : undefined,
          invoicePdf: invoice.invoice_pdf || undefined,
          invoiceUrl: invoice.hosted_invoice_url || undefined,
          lineItems: invoice.lines?.data || [],
          metadata: invoice.metadata,
        },
        { upsert: true, new: true },
      )
      .exec();
  }

  /**
   * Handle invoice payment failed
   */
  private async handleInvoicePaymentFailed(
    invoice: Stripe.Invoice,
  ): Promise<void> {
    const invoiceAny = invoice as any;
    const subscriptionId =
      typeof invoiceAny.subscription === 'string'
        ? invoiceAny.subscription
        : invoiceAny.subscription?.id || String(invoiceAny.subscription || '');

    const subscription = await this.subscriptionModel
      .findOne({ stripeSubscriptionId: subscriptionId })
      .exec();

    if (!subscription) {
      console.error('Subscription not found for invoice', invoice.id);
      return;
    }

    await this.invoiceModel
      .findOneAndUpdate(
        { stripeInvoiceId: invoice.id },
        {
          companyId: subscription.companyId,
          stripeInvoiceId: invoice.id,
          stripeSubscriptionId: subscriptionId,
          amount: invoice.amount_due,
          currency: invoice.currency,
          status: 'open',
          dueDate: invoice.due_date
            ? new Date(invoice.due_date * 1000)
            : undefined,
          invoiceUrl: invoice.hosted_invoice_url || undefined,
          lineItems: invoice.lines?.data || [],
          metadata: invoice.metadata,
        },
        { upsert: true, new: true },
      )
      .exec();
  }
}
