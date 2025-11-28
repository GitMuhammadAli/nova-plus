import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Workflow, WorkflowDocument, WorkflowNode, WorkflowConnection, Condition } from './entities/workflow.entity';
import { WorkflowExecution, WorkflowExecutionDocument, ExecutionStatus, StepStatus, ExecutionStep } from './entities/workflow-execution.entity';

@Injectable()
export class WorkflowEngineService {
  private readonly logger = new Logger(WorkflowEngineService.name);

  constructor(
    @InjectModel(Workflow.name) private workflowModel: Model<WorkflowDocument>,
    @InjectModel(WorkflowExecution.name) private executionModel: Model<WorkflowExecutionDocument>,
  ) {}

  /**
   * Execute a workflow
   */
  async executeWorkflow(
    workflowId: string,
    companyId: string,
    triggerData: any = {},
  ): Promise<WorkflowExecutionDocument> {
    const workflow = await this.workflowModel.findById(workflowId).lean();
    
    if (!workflow) {
      throw new Error('Workflow not found');
    }

    if (workflow.companyId.toString() !== companyId) {
      throw new Error('Workflow does not belong to company');
    }

    if (workflow.status !== 'active') {
      throw new Error('Workflow is not active');
    }

    // Create execution record
    const execution = new this.executionModel({
      workflowId: new Types.ObjectId(workflowId),
      companyId: new Types.ObjectId(companyId),
      status: ExecutionStatus.RUNNING,
      triggerData,
      steps: [],
      startedAt: new Date(),
    });

    await execution.save();

    try {
      // Find trigger node
      const triggerNode = workflow.nodes.find(n => n.type === 'trigger');
      
      if (!triggerNode) {
        throw new Error('No trigger node found');
      }

      // Execute workflow
      await this.executeNode(triggerNode, workflow, execution, triggerData);

      // Mark as completed
      execution.status = ExecutionStatus.COMPLETED;
      execution.completedAt = new Date();

      // Update workflow run count
      await this.workflowModel.findByIdAndUpdate(workflowId, {
        $inc: { runCount: 1 },
        lastRun: new Date(),
      });

    } catch (error) {
      this.logger.error(`Workflow execution failed: ${error.message}`, error.stack);
      execution.status = ExecutionStatus.FAILED;
      execution.error = error.message;
      execution.completedAt = new Date();
    }

    await execution.save();
    return execution;
  }

  /**
   * Execute a single node
   */
  private async executeNode(
    node: WorkflowNode,
    workflow: Workflow,
    execution: WorkflowExecutionDocument,
    data: any,
  ): Promise<any> {
    // Check if node already executed
    const existingStep = execution.steps.find(s => s.nodeId === node.id);
    if (existingStep && existingStep.status === StepStatus.SUCCESS) {
      return existingStep.output;
    }

    // Create step
    const step: ExecutionStep = {
      id: `step_${Date.now()}_${node.id}`,
      nodeId: node.id,
      nodeName: this.getNodeName(node),
      status: StepStatus.RUNNING,
      startTime: new Date(),
    };

    execution.steps.push(step);
    await execution.save();

    try {
      // Execute based on node type
      let output: any;

      if (node.type === 'trigger') {
        output = await this.executeTrigger(node, data);
      } else if (node.type === 'action') {
        output = await this.executeAction(node, data);
      }

      // Update step
      step.status = StepStatus.SUCCESS;
      step.endTime = new Date();
      step.output = output;

      // Find and execute connected nodes
      const connections = workflow.connections.filter(c => c.source === node.id);
      
      for (const connection of connections) {
        const shouldExecute = this.evaluateConditions(connection.conditions || [], connection.logic || 'AND', data);
        
        if (shouldExecute) {
          const targetNode = workflow.nodes.find(n => n.id === connection.target);
          if (targetNode) {
            await this.executeNode(targetNode, workflow, execution, { ...data, ...output });
          }
        } else {
          // Mark skipped
          const skippedStep: ExecutionStep = {
            id: `step_${Date.now()}_${connection.target}`,
            nodeId: connection.target,
            nodeName: this.getNodeName(workflow.nodes.find(n => n.id === connection.target) || node),
            status: StepStatus.SKIPPED,
            startTime: new Date(),
            endTime: new Date(),
          };
          execution.steps.push(skippedStep);
        }
      }

      await execution.save();
      return output;

    } catch (error) {
      this.logger.error(`Node execution failed: ${error.message}`, error.stack);
      step.status = StepStatus.FAILED;
      step.endTime = new Date();
      step.error = error.message;
      await execution.save();
      throw error;
    }
  }

  /**
   * Execute trigger node
   */
  private async executeTrigger(node: WorkflowNode, data: any): Promise<any> {
    // Triggers just pass through the data
    return { ...data, triggeredBy: node.triggerType };
  }

  /**
   * Execute action node
   */
  private async executeAction(node: WorkflowNode, data: any): Promise<any> {
    // Simulate action execution (replace with real implementations)
    await new Promise(resolve => setTimeout(resolve, 500));

    switch (node.actionType) {
      case 'send_email':
        return { emailSent: true, recipient: this.interpolate(node.config.recipient || '', data) };
      
      case 'send_sms':
        return { smsSent: true, phone: this.interpolate(node.config.phone || '', data) };
      
      case 'create_task':
        return { taskCreated: true, taskId: `task_${Date.now()}` };
      
      case 'update_record':
        return { recordUpdated: true, table: node.config.table };
      
      case 'call_webhook':
        return { webhookCalled: true, url: node.config.url };
      
      case 'send_notification':
        return { notificationSent: true, message: this.interpolate(node.config.message || '', data) };
      
      case 'log_event':
        return { eventLogged: true, message: this.interpolate(node.config.message || '', data) };
      
      default:
        return { actionCompleted: true };
    }
  }

  /**
   * Evaluate conditions
   */
  private evaluateConditions(
    conditions: Condition[],
    logic: 'AND' | 'OR',
    data: any,
  ): boolean {
    if (conditions.length === 0) return true;

    const results = conditions.map(condition => {
      const fieldValue = this.getFieldValue(data, condition.field);
      return this.compareValues(fieldValue, condition.operator, condition.value);
    });

    return logic === 'AND' 
      ? results.every(r => r)
      : results.some(r => r);
  }

  /**
   * Get field value from nested object
   */
  private getFieldValue(data: any, field: string): any {
    const parts = field.split('.');
    let value = data;
    for (const part of parts) {
      value = value?.[part];
    }
    return value;
  }

  /**
   * Compare values based on operator
   */
  private compareValues(value: any, operator: string, expected: string): boolean {
    const valueStr = String(value || '');
    const expectedStr = String(expected || '');

    switch (operator) {
      case 'equals':
        return valueStr === expectedStr;
      case 'not_equals':
        return valueStr !== expectedStr;
      case 'contains':
        return valueStr.toLowerCase().includes(expectedStr.toLowerCase());
      case 'not_contains':
        return !valueStr.toLowerCase().includes(expectedStr.toLowerCase());
      case 'greater_than':
        return Number(value) > Number(expected);
      case 'less_than':
        return Number(value) < Number(expected);
      case 'starts_with':
        return valueStr.toLowerCase().startsWith(expectedStr.toLowerCase());
      case 'ends_with':
        return valueStr.toLowerCase().endsWith(expectedStr.toLowerCase());
      default:
        return false;
    }
  }

  /**
   * Interpolate template strings
   */
  private interpolate(template: string, data: any): string {
    return template.replace(/\{\{(\w+(?:\.\w+)*)\}\}/g, (match, path) => {
      const value = this.getFieldValue(data, path);
      return value !== undefined ? String(value) : match;
    });
  }

  /**
   * Get node display name
   */
  private getNodeName(node: WorkflowNode): string {
    if (node.type === 'trigger') {
      return node.triggerType?.replace(/_/g, ' ') || 'Trigger';
    }
    return node.actionType?.replace(/_/g, ' ') || 'Action';
  }
}

