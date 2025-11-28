import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Workflow, WorkflowDocument, WorkflowStatus } from './entities/workflow.entity';
import { CreateWorkflowDto } from './dto/create-workflow.dto';
import { UpdateWorkflowDto } from './dto/update-workflow.dto';

@Injectable()
export class WorkflowService {
  constructor(
    @InjectModel(Workflow.name) private workflowModel: Model<WorkflowDocument>,
  ) {}

  /**
   * Create a new workflow
   */
  async create(createWorkflowDto: CreateWorkflowDto, companyId: string, userId: string): Promise<WorkflowDocument> {
    const workflow = new this.workflowModel({
      ...createWorkflowDto,
      companyId: new Types.ObjectId(companyId),
      createdBy: new Types.ObjectId(userId),
      status: createWorkflowDto.status || WorkflowStatus.DRAFT,
    });

    return workflow.save();
  }

  /**
   * Find all workflows for a company
   */
  async findAll(companyId: string, filters?: { status?: WorkflowStatus; search?: string }): Promise<WorkflowDocument[]> {
    const query: any = { companyId: new Types.ObjectId(companyId) };

    if (filters?.status) {
      query.status = filters.status;
    }

    if (filters?.search) {
      query.$or = [
        { name: { $regex: filters.search, $options: 'i' } },
        { description: { $regex: filters.search, $options: 'i' } },
      ];
    }

    return this.workflowModel.find(query).sort({ updatedAt: -1 });
  }

  /**
   * Find one workflow
   */
  async findOne(id: string, companyId: string): Promise<WorkflowDocument> {
    const workflow = await this.workflowModel.findOne({
      _id: id,
      companyId: new Types.ObjectId(companyId),
    });

    if (!workflow) {
      throw new NotFoundException('Workflow not found');
    }

    return workflow;
  }

  /**
   * Update workflow
   */
  async update(id: string, updateWorkflowDto: UpdateWorkflowDto, companyId: string): Promise<WorkflowDocument> {
    const workflow = await this.workflowModel.findOne({
      _id: id,
      companyId: new Types.ObjectId(companyId),
    });

    if (!workflow) {
      throw new NotFoundException('Workflow not found');
    }

    Object.assign(workflow, updateWorkflowDto);
    // updatedAt is automatically handled by timestamps: true in schema

    return workflow.save();
  }

  /**
   * Delete workflow
   */
  async remove(id: string, companyId: string): Promise<void> {
    const result = await this.workflowModel.deleteOne({
      _id: id,
      companyId: new Types.ObjectId(companyId),
    });

    if (result.deletedCount === 0) {
      throw new NotFoundException('Workflow not found');
    }
  }

  /**
   * Toggle workflow status
   */
  async toggleStatus(id: string, companyId: string): Promise<WorkflowDocument> {
    const workflow = await this.workflowModel.findOne({
      _id: id,
      companyId: new Types.ObjectId(companyId),
    });

    if (!workflow) {
      throw new NotFoundException('Workflow not found');
    }

    if (workflow.status === WorkflowStatus.ACTIVE) {
      workflow.status = WorkflowStatus.INACTIVE;
    } else if (workflow.status === WorkflowStatus.INACTIVE || workflow.status === WorkflowStatus.DRAFT) {
      // Validate workflow before activating
      if (workflow.nodes.length === 0) {
        throw new ForbiddenException('Cannot activate workflow without nodes');
      }
      const hasTrigger = workflow.nodes.some(n => n.type === 'trigger');
      if (!hasTrigger) {
        throw new ForbiddenException('Cannot activate workflow without trigger node');
      }
      workflow.status = WorkflowStatus.ACTIVE;
    }
    // updatedAt is automatically handled by timestamps: true in schema

    return workflow.save();
  }

  /**
   * Duplicate workflow
   */
  async duplicate(id: string, companyId: string, userId: string): Promise<WorkflowDocument> {
    const original = await this.findOne(id, companyId);
    
    const duplicated = new this.workflowModel({
      name: `${original.name} (Copy)`,
      description: original.description,
      companyId: new Types.ObjectId(companyId),
      createdBy: new Types.ObjectId(userId),
      status: WorkflowStatus.DRAFT,
      nodes: original.nodes,
      connections: original.connections,
      tags: original.tags,
      runCount: 0,
    });

    return duplicated.save();
  }
}

