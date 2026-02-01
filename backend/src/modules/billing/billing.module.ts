import { Module, forwardRef } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { BillingService } from './billing.service';
import { BillingController } from './billing.controller';
import { Subscription, SubscriptionSchema } from './entities/billing.entity';
import { Invoice, InvoiceSchema } from './entities/billing.entity';
import { AuditModule } from '../audit/audit.module';
import { PlanLimitsService } from './plan-limits.service';
import { FeatureGuard, LimitCheckGuard } from './plan-limits.guard';
import { User, UserSchema } from '../user/entities/user.entity';
import {
  Department,
  DepartmentSchema,
} from '../department/entities/department.entity';
import { Project, ProjectSchema } from '../project/entities/project.entity';
// Team entity removed - teams are counted via departments
import { Workflow, WorkflowSchema } from '../workflow/entities/workflow.entity';
import { Upload, UploadSchema } from '../uploads/entities/upload.entity';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Subscription.name, schema: SubscriptionSchema },
      { name: Invoice.name, schema: InvoiceSchema },
      { name: User.name, schema: UserSchema },
      { name: Department.name, schema: DepartmentSchema },
      { name: Project.name, schema: ProjectSchema },
      { name: Workflow.name, schema: WorkflowSchema },
      { name: Upload.name, schema: UploadSchema },
    ]),
    AuditModule,
  ],
  controllers: [BillingController],
  providers: [BillingService, PlanLimitsService, FeatureGuard, LimitCheckGuard],
  exports: [BillingService, PlanLimitsService, FeatureGuard, LimitCheckGuard],
})
export class BillingModule {}
