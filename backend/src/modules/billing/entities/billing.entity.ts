import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type SubscriptionDocument = Subscription & Document;
export type InvoiceDocument = Invoice & Document;

@Schema({ timestamps: true })
export class Subscription {
  @Prop({ type: Types.ObjectId, ref: 'Company', required: true, unique: true })
  companyId: Types.ObjectId;

  @Prop({ required: true, unique: true })
  stripeSubscriptionId: string;

  @Prop({ required: true })
  stripeCustomerId: string;

  @Prop({ required: true })
  status: string; // active, canceled, past_due, trialing, etc.

  @Prop({ required: true })
  planId: string;

  @Prop()
  planName?: string;

  @Prop()
  currentPeriodStart?: Date;

  @Prop()
  currentPeriodEnd?: Date;

  @Prop()
  cancelAtPeriodEnd?: boolean;

  @Prop()
  canceledAt?: Date;

  @Prop({ type: Object })
  metadata?: Record<string, any>;
}

@Schema({ timestamps: true })
export class Invoice {
  @Prop({ type: Types.ObjectId, ref: 'Company', required: true })
  companyId: Types.ObjectId;

  @Prop({ required: true, unique: true })
  stripeInvoiceId: string;

  @Prop({ required: true })
  stripeSubscriptionId: string;

  @Prop({ required: true })
  amount: number; // in cents

  @Prop({ required: true })
  currency: string;

  @Prop({ required: true })
  status: string; // paid, open, void, uncollectible

  @Prop()
  paidAt?: Date;

  @Prop()
  dueDate?: Date;

  @Prop()
  invoicePdf?: string;

  @Prop()
  invoiceUrl?: string;

  @Prop({ type: Object })
  lineItems?: any[];

  @Prop({ type: Object })
  metadata?: Record<string, any>;
}

export const SubscriptionSchema = SchemaFactory.createForClass(Subscription);
export const InvoiceSchema = SchemaFactory.createForClass(Invoice);

// Indexes
SubscriptionSchema.index({ companyId: 1 });
SubscriptionSchema.index({ stripeSubscriptionId: 1 });
SubscriptionSchema.index({ stripeCustomerId: 1 });

InvoiceSchema.index({ companyId: 1, createdAt: -1 });
InvoiceSchema.index({ stripeInvoiceId: 1 });
InvoiceSchema.index({ stripeSubscriptionId: 1 });
