export type WorkflowStatus = "active" | "inactive" | "draft";

export type TriggerType =
  | "user_created"
  | "user_updated"
  | "order_placed"
  | "payment_received"
  | "form_submitted"
  | "schedule"
  | "webhook";

export type ActionType =
  | "send_email"
  | "send_sms"
  | "create_task"
  | "update_record"
  | "call_webhook"
  | "send_notification"
  | "log_event";

export interface WorkflowNode {
  id: string;
  type: "trigger" | "action";
  triggerType?: TriggerType;
  actionType?: ActionType;
  config: Record<string, any>;
  position: { x: number; y: number };
}

export interface WorkflowConnection {
  id: string;
  source: string;
  target: string;
  conditions?: any[];
  logic?: "AND" | "OR";
}

export interface Workflow {
  id: string;
  name: string;
  description: string;
  status: WorkflowStatus;
  nodes: WorkflowNode[];
  connections: WorkflowConnection[];
  runCount: number;
  createdAt: Date;
  updatedAt: Date;
  lastRun?: Date;
  tags?: string[];
}

