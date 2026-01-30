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
}

export interface Workflow {
  id: string;
  name: string;
  description: string;
  status: "active" | "inactive" | "draft";
  nodes: WorkflowNode[];
  connections: WorkflowConnection[];
  lastRun?: Date;
  runCount: number;
  createdAt: Date;
  updatedAt: Date;
  tags?: string[];
}

export const mockWorkflows: Workflow[] = [
  {
    id: "wf1",
    name: "Welcome New Users",
    description: "Send welcome email when a user signs up",
    status: "active",
    nodes: [
      {
        id: "n1",
        type: "trigger",
        triggerType: "user_created",
        config: {},
        position: { x: 100, y: 200 }
      },
      {
        id: "n2",
        type: "action",
        actionType: "send_email",
        config: { template: "welcome" },
        position: { x: 400, y: 200 }
      }
    ],
    connections: [
      { id: "c1", source: "n1", target: "n2" }
    ],
    lastRun: new Date(Date.now() - 3600000),
    runCount: 142,
    createdAt: new Date(Date.now() - 86400000 * 30),
    updatedAt: new Date(Date.now() - 3600000)
  },
  {
    id: "wf2",
    name: "Order Confirmation",
    description: "Send confirmation email and SMS when order is placed",
    status: "active",
    nodes: [
      {
        id: "n1",
        type: "trigger",
        triggerType: "order_placed",
        config: {},
        position: { x: 100, y: 200 }
      },
      {
        id: "n2",
        type: "action",
        actionType: "send_email",
        config: { template: "order_confirmation" },
        position: { x: 400, y: 150 }
      },
      {
        id: "n3",
        type: "action",
        actionType: "send_sms",
        config: { template: "order_sms" },
        position: { x: 400, y: 250 }
      }
    ],
    connections: [
      { id: "c1", source: "n1", target: "n2" },
      { id: "c2", source: "n1", target: "n3" }
    ],
    lastRun: new Date(Date.now() - 300000),
    runCount: 487,
    createdAt: new Date(Date.now() - 86400000 * 45),
    updatedAt: new Date(Date.now() - 300000)
  }
];
