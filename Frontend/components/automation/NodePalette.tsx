"use client"

import { motion } from "framer-motion";
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
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";

interface NodePaletteProps {
  onAddNode: (type: "trigger" | "action", nodeType: string) => void;
}

const triggers = [
  { type: "user_created", label: "User Created", icon: UserPlus },
  { type: "user_updated", label: "User Updated", icon: RefreshCw },
  { type: "order_placed", label: "Order Placed", icon: ShoppingCart },
  { type: "payment_received", label: "Payment Received", icon: DollarSign },
  { type: "form_submitted", label: "Form Submitted", icon: FileText },
  { type: "schedule", label: "Schedule", icon: Calendar },
  { type: "webhook", label: "Webhook", icon: Webhook },
];

const actions = [
  { type: "send_email", label: "Send Email", icon: Mail },
  { type: "send_sms", label: "Send SMS", icon: MessageSquare },
  { type: "create_task", label: "Create Task", icon: CheckSquare },
  { type: "update_record", label: "Update Record", icon: Database },
  { type: "call_webhook", label: "Call Webhook", icon: Webhook },
  { type: "send_notification", label: "Send Notification", icon: Bell },
  { type: "log_event", label: "Log Event", icon: FileText },
];

export function NodePalette({ onAddNode }: NodePaletteProps) {
  return (
    <Card className="w-64 m-4 border-r-0 rounded-r-none">
      <ScrollArea className="h-[calc(100vh-96px)]">
        <div className="p-4 space-y-4">
          <div>
            <h3 className="font-semibold mb-3 text-sm uppercase text-muted-foreground">
              Triggers
            </h3>
            <div className="space-y-2">
              {triggers.map((trigger, index) => (
                <motion.button
                  key={trigger.type}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  onClick={() => onAddNode("trigger", trigger.type)}
                  className="w-full flex items-center gap-3 p-3 rounded-lg border bg-card hover:bg-primary/5 hover:border-primary transition-colors text-left"
                >
                  <div className="p-2 rounded-lg bg-primary/10">
                    <trigger.icon className="h-4 w-4 text-primary" />
                  </div>
                  <span className="text-sm font-medium">{trigger.label}</span>
                </motion.button>
              ))}
            </div>
          </div>

          <Separator />

          <div>
            <h3 className="font-semibold mb-3 text-sm uppercase text-muted-foreground">
              Actions
            </h3>
            <div className="space-y-2">
              {actions.map((action, index) => (
                <motion.button
                  key={action.type}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: (triggers.length + index) * 0.05 }}
                  onClick={() => onAddNode("action", action.type)}
                  className="w-full flex items-center gap-3 p-3 rounded-lg border bg-card hover:bg-accent/5 hover:border-accent transition-colors text-left"
                >
                  <div className="p-2 rounded-lg bg-accent/10">
                    <action.icon className="h-4 w-4 text-accent" />
                  </div>
                  <span className="text-sm font-medium">{action.label}</span>
                </motion.button>
              ))}
            </div>
          </div>
        </div>
      </ScrollArea>
    </Card>
  );
}
