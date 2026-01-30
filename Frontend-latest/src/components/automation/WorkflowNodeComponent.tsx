import { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import { WorkflowNode } from "@/types/automation";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { X, Settings } from "lucide-react";
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
import { Button } from "@/components/ui/button";

interface WorkflowNodeComponentProps {
  node: WorkflowNode;
  zoom: number;
  pan: { x: number; y: number };
  onPositionChange: (position: { x: number; y: number }) => void;
  onDelete: () => void;
  onConfigure: () => void;
  onConnectionStart?: (nodeId: string, position: { x: number; y: number }) => void;
  onConnectionEnd?: (nodeId: string) => void;
  isConnecting?: boolean;
}

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

export function WorkflowNodeComponent({ 
  node,
  zoom,
  pan,
  onPositionChange, 
  onDelete, 
  onConfigure,
  onConnectionStart,
  onConnectionEnd,
  isConnecting = false
}: WorkflowNodeComponentProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const nodeRef = useRef<HTMLDivElement>(null);

  const nodeType = node.triggerType || node.actionType || "";
  const label = labelMap[nodeType] || nodeType;

  const handleMouseDown = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsDragging(true);
    // Store the offset between mouse position and node position in canvas coordinates
    setDragOffset({
      x: e.clientX / zoom - node.position.x - pan.x / zoom,
      y: e.clientY / zoom - node.position.y - pan.y / zoom,
    });
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (isDragging) {
      // Calculate new position in canvas coordinates
      onPositionChange({
        x: e.clientX / zoom - dragOffset.x - pan.x / zoom,
        y: e.clientY / zoom - dragOffset.y - pan.y / zoom,
      });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleConnectionStart = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onConnectionStart && nodeRef.current) {
      const rect = nodeRef.current.getBoundingClientRect();
      const centerX = node.position.x + rect.width / 2;
      const centerY = node.position.y + rect.height / 2;
      onConnectionStart(node.id, { x: centerX, y: centerY });
    }
  };

  const handleConnectionEnd = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onConnectionEnd) {
      onConnectionEnd(node.id);
    }
  };

  const IconComponent = iconMap[nodeType] || FileText;

  useEffect(() => {
    if (isDragging) {
      window.addEventListener("mousemove", handleMouseMove);
      window.addEventListener("mouseup", handleMouseUp);
      return () => {
        window.removeEventListener("mousemove", handleMouseMove);
        window.removeEventListener("mouseup", handleMouseUp);
      };
    }
  }, [isDragging, dragOffset]);

  return (
    <motion.div
      ref={nodeRef}
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.8 }}
      style={{
        position: "absolute",
        left: node.position.x,
        top: node.position.y,
        cursor: isDragging ? "grabbing" : "grab",
      }}
      onMouseDown={handleMouseDown}
      onMouseUp={handleConnectionEnd}
      className={isConnecting ? "ring-2 ring-primary ring-offset-2" : ""}
    >
      <Card className="w-64 p-4 shadow-lg hover:shadow-xl transition-all">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className={`p-2 rounded-lg ${
              node.type === "trigger" 
                ? "bg-primary/10 text-primary" 
                : "bg-accent/10 text-accent"
            }`}>
              <IconComponent className="h-5 w-5" />
            </div>
            <div>
              <Badge variant={node.type === "trigger" ? "default" : "secondary"} className="text-xs">
                {node.type}
              </Badge>
            </div>
          </div>
          <div className="flex gap-1">
            <Button
              size="icon"
              variant="ghost"
              className="h-6 w-6"
              onClick={(e) => {
                e.stopPropagation();
                onConfigure();
              }}
            >
              <Settings className="h-3 w-3" />
            </Button>
            <Button
              size="icon"
              variant="ghost"
              className="h-6 w-6 hover:bg-destructive/10"
              onClick={(e) => {
                e.stopPropagation();
                onDelete();
              }}
            >
              <X className="h-3 w-3 text-destructive" />
            </Button>
          </div>
        </div>
        
        <div className="space-y-2">
          <h4 className="font-medium text-sm">{label}</h4>
          {Object.keys(node.config).length > 0 && (
            <p className="text-xs text-muted-foreground">
              ✓ Configured
            </p>
          )}
        </div>

        {/* Connection handles */}
        <div 
          className="absolute -right-2 top-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-primary border-2 border-background cursor-pointer hover:scale-110 transition-transform"
          onMouseDown={handleConnectionStart}
          title="Drag to connect"
        />
        <div 
          className="absolute -left-2 top-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-accent border-2 border-background"
          title="Connection point"
        />
      </Card>
    </motion.div>
  );
}
