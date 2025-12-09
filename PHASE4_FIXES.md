# Phase 4 TypeScript Fixes

## Fixed Code Snippets

### 1. billing.service.ts - Fix AuditService calls and Stripe API

```typescript
// Line 32: Fix Stripe API version
this.stripe = new Stripe(stripeSecretKey, {
  apiVersion: '2025-11-17.clover', // Use latest supported version
});

// Line 70: Fix audit log call
await this.auditService.createLog({
  action: AuditAction.CREATE,
  resource: AuditResource.SETTINGS, // Use enum, closest match
  resourceId: session.id,
  userId,
  companyId,
  metadata: {
    priceId: createCheckoutDto.priceId,
  },
});

// Line 182: Fix Stripe usage record (use correct API)
await this.stripe.subscriptionItems.createUsageRecord(
  updateUsageDto.subscriptionItemId,
  {
    quantity: updateUsageDto.quantity,
    timestamp: Math.floor(Date.now() / 1000),
  }
);

// Line 188: Fix audit log
await this.auditService.createLog({
  action: AuditAction.UPDATE,
  resource: AuditResource.SETTINGS,
  resourceId: (subscription._id as any)?.toString() || subscription._id,
  userId,
  companyId,
  metadata: updateUsageDto,
});

// Line 231: Fix audit log
await this.auditService.createLog({
  action: AuditAction.DELETE,
  resource: AuditResource.SETTINGS,
  resourceId: (subscription._id as any)?.toString() || subscription._id,
  userId,
  companyId,
  metadata: { immediately: cancelDto.immediately },
});

// Line 295-307: Fix companyId assignment
private async handleSubscriptionUpdated(subscription: Stripe.Subscription): Promise<void> {
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

  await this.subscriptionModel.findOneAndUpdate(
    { stripeSubscriptionId: subscription.id },
    {
      companyId: new Types.ObjectId(companyId),
      stripeSubscriptionId: subscription.id,
      stripeCustomerId: subscription.customer as string,
      status: subscription.status,
      planId: price?.id || '',
      planName: product?.name || '',
      currentPeriodStart: new Date((subscription as any).current_period_start * 1000),
      currentPeriodEnd: new Date((subscription as any).current_period_end * 1000),
      cancelAtPeriodEnd: subscription.cancel_at_period_end,
      canceledAt: subscription.canceled_at
        ? new Date(subscription.canceled_at * 1000)
        : undefined,
      metadata: subscription.metadata,
    },
    { upsert: true, new: true },
  ).exec();
}

// Line 351-380: Fix invoice.subscription access
private async handleInvoicePaid(invoice: Stripe.Invoice): Promise<void> {
  const subscriptionId = typeof invoice.subscription === 'string' 
    ? invoice.subscription 
    : (invoice.subscription as any)?.id || invoice.subscription;
  
  const subscription = await this.subscriptionModel
    .findOne({ stripeSubscriptionId: subscriptionId })
    .exec();

  if (!subscription) {
    console.error('Subscription not found for invoice', invoice.id);
    return;
  }

  await this.invoiceModel.findOneAndUpdate(
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
      dueDate: invoice.due_date ? new Date(invoice.due_date * 1000) : undefined,
      invoicePdf: invoice.invoice_pdf || undefined,
      invoiceUrl: invoice.hosted_invoice_url || undefined,
      lineItems: invoice.lines?.data || [],
      metadata: invoice.metadata,
    },
    { upsert: true, new: true },
  ).exec();
}

// Line 386-411: Fix invoice.subscription access
private async handleInvoicePaymentFailed(invoice: Stripe.Invoice): Promise<void> {
  const subscriptionId = typeof invoice.subscription === 'string' 
    ? invoice.subscription 
    : (invoice.subscription as any)?.id || invoice.subscription;
  
  const subscription = await this.subscriptionModel
    .findOne({ stripeSubscriptionId: subscriptionId })
    .exec();

  if (!subscription) {
    console.error('Subscription not found for invoice', invoice.id);
    return;
  }

  await this.invoiceModel.findOneAndUpdate(
    { stripeInvoiceId: invoice.id },
    {
      companyId: subscription.companyId,
      stripeInvoiceId: invoice.id,
      stripeSubscriptionId: subscriptionId,
      amount: invoice.amount_due,
      currency: invoice.currency,
      status: 'open',
      dueDate: invoice.due_date ? new Date(invoice.due_date * 1000) : undefined,
      invoiceUrl: invoice.hosted_invoice_url || undefined,
      lineItems: invoice.lines?.data || [],
      metadata: invoice.metadata,
    },
    { upsert: true, new: true },
  ).exec();
}
```

### 2. Add imports to billing.service.ts

```typescript
import { AuditService } from '../audit/audit.service';
import { AuditAction, AuditResource } from '../audit/entities/audit-log.entity';
```

### 3. uploads.service.ts - Fix AuditService calls

```typescript
// Line 99: Fix audit log
await this.auditService.createLog({
  action: AuditAction.CREATE,
  resource: AuditResource.TASK, // Use closest enum
  resourceId: (savedUpload._id as any)?.toString() || savedUpload._id,
  userId,
  companyId,
  metadata: {
    filename: savedUpload.filename,
    size: savedUpload.size,
    mimeType: savedUpload.mimeType,
  },
});

// Line 211: Fix audit log
await this.auditService.createLog({
  action: AuditAction.UPDATE,
  resource: AuditResource.TASK,
  resourceId: id,
  userId,
  companyId,
  metadata: updateUploadDto,
});

// Line 247: Fix audit log
await this.auditService.createLog({
  action: AuditAction.DELETE,
  resource: AuditResource.TASK,
  resourceId: id,
  userId,
  companyId,
  metadata: {
    filename: upload.filename,
  },
});

// Line 271: Fix audit log
await this.auditService.createLog({
  action: AuditAction.UPDATE,
  resource: AuditResource.TASK,
  resourceId: id,
  userId,
  companyId,
});
```

### 4. Add imports to uploads.service.ts

```typescript
import { AuditService } from '../audit/audit.service';
import { AuditAction, AuditResource } from '../audit/entities/audit-log.entity';
```

### 5. uploads.controller.ts - Fix parameter order

```typescript
// Line 60-66: Fix parameter order
@Post()
@UseInterceptors(FileInterceptor('file'))
async uploadFile(
  @UploadedFile() file: Express.Multer.File,
  @Body() createUploadDto: CreateUploadDto,
  @Req() req: any,
) {
```

### 6. integrations.service.ts - Fix AuditService calls

```typescript
// Line 80: Fix audit log
await this.auditService.createLog({
  action: AuditAction.CREATE,
  resource: AuditResource.SETTINGS,
  resourceId: companyId,
  userId,
  companyId,
});

// Line 125: Fix audit log
await this.auditService.createLog({
  action: AuditAction.CREATE,
  resource: AuditResource.SETTINGS,
  resourceId: companyId,
  userId,
  companyId,
});

// Line 210: Fix audit log
await this.auditService.createLog({
  action: AuditAction.CREATE,
  resource: AuditResource.SETTINGS,
  resourceId: companyId,
  userId,
  companyId,
});

// Line 268: Fix audit log
await this.auditService.createLog({
  action: AuditAction.DELETE,
  resource: AuditResource.SETTINGS,
  resourceId: integrationId,
  userId,
  companyId,
  metadata: { type: integration.type },
});
```

### 7. Add imports to integrations.service.ts

```typescript
import { AuditService } from '../audit/audit.service';
import { AuditAction, AuditResource } from '../audit/entities/audit-log.entity';
```

