"use client"

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Workflow } from "@/types/automation";
import { Copy, Eye, Zap, Mail, Calendar, Users, ShoppingCart, Bell } from "lucide-react";
import { motion } from "framer-motion";

interface WorkflowTemplatesProps {
  onUseTemplate: (workflow: Workflow) => void;
}

const workflowTemplates: Workflow[] = [
  {
    id: "template-1",
    name: "Welcome Email Sequence",
    description: "Send automated welcome emails to new users",
    nodes: [
      {
        id: "node-1",
        type: "trigger",
        triggerType: "user_created",
        config: {},
        position: { x: 100, y: 100 }
      },
      {
        id: "node-2",
        type: "action",
        actionType: "send_email",
        config: { template: "welcome", subject: "Welcome to our platform!" },
        position: { x: 400, y: 100 }
      }
    ],
    connections: [
      { id: "conn-1", source: "node-1", target: "node-2" }
    ],
    status: "inactive",
    createdAt: new Date(),
    updatedAt: new Date(),
    runCount: 0,
    tags: ["onboarding", "email"]
  },
  {
    id: "template-2",
    name: "Order Notification System",
    description: "Notify customers when their order status changes",
    nodes: [
      {
        id: "node-1",
        type: "trigger",
        triggerType: "order_placed",
        config: {},
        position: { x: 100, y: 100 }
      },
      {
        id: "node-2",
        type: "action",
        actionType: "send_email",
        config: { template: "confirmation", subject: "Order Confirmed" },
        position: { x: 400, y: 100 }
      },
      {
        id: "node-3",
        type: "action",
        actionType: "send_sms",
        config: { message: "Your order has been confirmed!" },
        position: { x: 400, y: 250 }
      }
    ],
    connections: [
      { id: "conn-1", source: "node-1", target: "node-2" },
      { id: "conn-2", source: "node-1", target: "node-3" }
    ],
    status: "inactive",
    createdAt: new Date(),
    updatedAt: new Date(),
    runCount: 0,
    tags: ["ecommerce", "notifications"]
  },
  {
    id: "template-3",
    name: "Daily Report Generator",
    description: "Generate and send daily analytics reports",
    nodes: [
      {
        id: "node-1",
        type: "trigger",
        triggerType: "schedule",
        config: { scheduleType: "daily", scheduleValue: "09:00" },
        position: { x: 100, y: 100 }
      },
      {
        id: "node-2",
        type: "action",
        actionType: "call_webhook",
        config: { url: "https://api.example.com/reports", method: "GET" },
        position: { x: 400, y: 100 }
      },
      {
        id: "node-3",
        type: "action",
        actionType: "send_email",
        config: { template: "notification", subject: "Daily Report" },
        position: { x: 700, y: 100 }
      }
    ],
    connections: [
      { id: "conn-1", source: "node-1", target: "node-2" },
      { id: "conn-2", source: "node-2", target: "node-3" }
    ],
    status: "inactive",
    createdAt: new Date(),
    updatedAt: new Date(),
    runCount: 0,
    tags: ["reporting", "scheduled"]
  },
  {
    id: "template-4",
    name: "Customer Engagement Campaign",
    description: "Re-engage inactive customers automatically",
    nodes: [
      {
        id: "node-1",
        type: "trigger",
        triggerType: "user_updated",
        config: { filter: "lastSeen > 30 days" },
        position: { x: 100, y: 100 }
      },
      {
        id: "node-2",
        type: "action",
        actionType: "send_email",
        config: { template: "notification", subject: "We miss you!" },
        position: { x: 400, y: 100 }
      },
      {
        id: "node-3",
        type: "action",
        actionType: "update_record",
        config: { table: "users", fields: '{"engagementStatus": "contacted"}' },
        position: { x: 700, y: 100 }
      }
    ],
    connections: [
      { id: "conn-1", source: "node-1", target: "node-2" },
      { id: "conn-2", source: "node-2", target: "node-3" }
    ],
    status: "inactive",
    createdAt: new Date(),
    updatedAt: new Date(),
    runCount: 0,
    tags: ["marketing", "retention"]
  }
];

const templateIcons: Record<string, any> = {
  "template-1": Mail,
  "template-2": ShoppingCart,
  "template-3": Calendar,
  "template-4": Users
};

export function WorkflowTemplates({ onUseTemplate }: WorkflowTemplatesProps) {
  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-semibold mb-2">Workflow Templates</h3>
        <p className="text-sm text-muted-foreground">
          Start with pre-built workflows and customize them to your needs
        </p>
      </div>

      <ScrollArea className="h-[600px] pr-4">
        <div className="grid gap-4">
          {workflowTemplates.map((template, index) => {
            const Icon = templateIcons[template.id] || Zap;
            
            return (
              <motion.div
                key={template.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Card className="p-4 hover:border-primary/50 transition-colors">
                  <div className="flex items-start gap-4">
                    <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <Icon className="h-6 w-6 text-primary" />
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <h4 className="font-semibold mb-1">{template.name}</h4>
                      <p className="text-sm text-muted-foreground mb-3">
                        {template.description}
                      </p>
                      
                      <div className="flex flex-wrap gap-2 mb-3">
                        {template.tags?.map(tag => (
                          <Badge key={tag} variant="secondary" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                      
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <span>{template.nodes.length} nodes</span>
                        <span>•</span>
                        <span>{template.connections.length} connections</span>
                      </div>
                    </div>
                    
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onUseTemplate(template)}
                      >
                        <Copy className="h-4 w-4 mr-2" />
                        Use Template
                      </Button>
                    </div>
                  </div>
                </Card>
              </motion.div>
            );
          })}
        </div>
      </ScrollArea>
    </div>
  );
}
