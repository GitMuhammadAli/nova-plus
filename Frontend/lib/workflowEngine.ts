import { Workflow, WorkflowExecution, ExecutionStep } from "@/components/automation/WorkflowExecutionLog";

export class WorkflowEngine {
  private workflow: Workflow;

  constructor(workflow: Workflow) {
    this.workflow = workflow;
  }

  async execute(triggerData: any): Promise<WorkflowExecution> {
    const execution: WorkflowExecution = {
      id: `exec-${Date.now()}`,
      workflowId: this.workflow.id,
      workflowName: this.workflow.name,
      status: "running",
      startTime: new Date(),
      trigger: triggerData,
      steps: [],
    };

    try {
      // Find the trigger node
      const triggerNode = this.workflow.nodes.find((n) => n.type === "trigger");
      if (!triggerNode) {
        throw new Error("No trigger node found");
      }

      // Execute trigger step
      const triggerStep: ExecutionStep = {
        id: `step-${Date.now()}-trigger`,
        nodeId: triggerNode.id,
        nodeName: triggerNode.triggerType || "Trigger",
        status: "success",
        startTime: new Date(),
        endTime: new Date(),
        output: triggerData,
      };
      execution.steps.push(triggerStep);

      // Execute action nodes in order
      const actionNodes = this.workflow.nodes.filter((n) => n.type === "action");
      const connections = this.workflow.connections;

      for (const actionNode of actionNodes) {
        const step: ExecutionStep = {
          id: `step-${Date.now()}-${actionNode.id}`,
          nodeId: actionNode.id,
          nodeName: actionNode.actionType || "Action",
          status: "running",
          startTime: new Date(),
        };
        execution.steps.push(step);

        // Simulate action execution
        await new Promise((resolve) => setTimeout(resolve, 500));

        step.status = "success";
        step.endTime = new Date();
        step.output = {
          action: actionNode.actionType,
          config: actionNode.config,
          result: "Action executed successfully",
        };
      }

      execution.status = "completed";
      execution.endTime = new Date();
    } catch (error: any) {
      execution.status = "failed";
      execution.endTime = new Date();
      if (execution.steps.length > 0) {
        const lastStep = execution.steps[execution.steps.length - 1];
        lastStep.status = "failed";
        lastStep.endTime = new Date();
        lastStep.error = error.message;
      }
    }

    return execution;
  }
}

