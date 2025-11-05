import { memo } from "react";
import { Handle, Position, NodeProps } from "@xyflow/react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  UserPlus,
  RefreshCw,
  ShoppingCart,
  DollarSign,
  FileText,
  Calendar,
  Webhook,
  Mail,
  MessageSquare,
  CheckSquare,
  Database,
  Bell,
} from "lucide-react";

const iconMap: Record<string, any> = {
  user_created: UserPlus,
  user_updated: RefreshCw,
  order_placed: ShoppingCart,
  payment_received: DollarSign,
  form_submitted: FileText,
  schedule: Calendar,
  webhook: Webhook,
  send_email: Mail,
  send_sms: MessageSquare,
  create_task: CheckSquare,
  update_record: Database,
  call_webhook: Webhook,
  send_notification: Bell,
  log_event: FileText,
};

const labelMap: Record<string, string> = {
  user_created: "User Created",
  user_updated: "User Updated",
  order_placed: "Order Placed",
  payment_received: "Payment Received",
  form_submitted: "Form Submitted",
  schedule: "Schedule",
  webhook: "Webhook",
  send_email: "Send Email",
  send_sms: "Send SMS",
  create_task: "Create Task",
  update_record: "Update Record",
  call_webhook: "Call Webhook",
  send_notification: "Send Notification",
  log_event: "Log Event",
};

export const CustomNode = memo(({ data }: NodeProps) => {
  const nodeType = (data.triggerType || data.actionType || "") as string;
  const label = labelMap[nodeType] || nodeType;
  const IconComponent = iconMap[nodeType] || FileText;

  return (
    <Card className="min-w-[200px] p-4 shadow-lg hover:shadow-xl transition-all">
      <Handle type="target" position={Position.Left} className="w-3 h-3" />
      
      <div className="flex items-start gap-3">
        <div className={`p-2 rounded-lg ${
          data.type === "trigger" 
            ? "bg-primary/10 text-primary" 
            : "bg-accent/10 text-accent"
        }`}>
          <IconComponent className="h-5 w-5" />
        </div>
        
        <div className="flex-1">
          <Badge variant={data.type === "trigger" ? "default" : "secondary"} className="text-xs mb-2">
            {data.type as string}
          </Badge>
          <h4 className="font-medium text-sm">{label}</h4>
          {Object.keys((data.config || {}) as Record<string, any>).length > 0 && (
            <p className="text-xs text-muted-foreground mt-1">
              ✓ Configured
            </p>
          )}
        </div>
      </div>

      <Handle type="source" position={Position.Right} className="w-3 h-3" />
    </Card>
  );
});

CustomNode.displayName = "CustomNode";
