import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { 
  Plus, 
  Trash2, 
  Webhook,
  Copy,
  CheckCircle2,
  XCircle
} from "lucide-react";
import { motion } from "framer-motion";

interface WebhookConfig {
  id: string;
  name: string;
  url: string;
  events: string[];
  status: "active" | "inactive";
  lastTriggered?: string;
}

export function WebhooksConfig() {
  const [webhooks, setWebhooks] = useState<WebhookConfig[]>([
    {
      id: "1",
      name: "User Events",
      url: "https://api.example.com/webhooks/users",
      events: ["user.created", "user.updated"],
      status: "active",
      lastTriggered: "2 hours ago"
    },
    {
      id: "2",
      name: "Payment Events",
      url: "https://api.example.com/webhooks/payments",
      events: ["payment.succeeded", "payment.failed"],
      status: "active",
      lastTriggered: "5 minutes ago"
    },
  ]);

  const [isAdding, setIsAdding] = useState(false);
  const [newWebhook, setNewWebhook] = useState({ name: "", url: "" });

  const handleAddWebhook = () => {
    if (newWebhook.name && newWebhook.url) {
      setWebhooks([
        ...webhooks,
        {
          ...newWebhook,
          id: Date.now().toString(),
          events: [],
          status: "inactive"
        }
      ]);
      setNewWebhook({ name: "", url: "" });
      setIsAdding(false);
    }
  };

  const handleDeleteWebhook = (id: string) => {
    setWebhooks(webhooks.filter(webhook => webhook.id !== id));
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="space-y-6"
    >
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold text-foreground">Webhooks</h3>
            <p className="text-sm text-muted-foreground mt-1">
              Connect external services to receive real-time events
            </p>
          </div>
          <Button onClick={() => setIsAdding(true)} variant="outline">
            <Plus className="w-4 h-4 mr-2" />
            Add Webhook
          </Button>
        </div>

        {isAdding && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            className="mb-4 p-4 rounded-lg border bg-accent/20"
          >
            <div className="space-y-3">
              <div>
                <Label htmlFor="webhook-name">Webhook Name</Label>
                <Input
                  id="webhook-name"
                  value={newWebhook.name}
                  onChange={(e) => setNewWebhook({ ...newWebhook, name: e.target.value })}
                  placeholder="e.g., Slack Notifications"
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="webhook-url">Endpoint URL</Label>
                <Input
                  id="webhook-url"
                  value={newWebhook.url}
                  onChange={(e) => setNewWebhook({ ...newWebhook, url: e.target.value })}
                  placeholder="https://api.example.com/webhook"
                  className="mt-1"
                />
              </div>
              <div className="flex gap-2">
                <Button onClick={handleAddWebhook} size="sm">
                  Add Webhook
                </Button>
                <Button onClick={() => setIsAdding(false)} variant="ghost" size="sm">
                  Cancel
                </Button>
              </div>
            </div>
          </motion.div>
        )}

        <div className="space-y-3">
          {webhooks.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Webhook className="w-12 h-12 mx-auto mb-2 opacity-50" />
              <p>No webhooks configured yet</p>
            </div>
          ) : (
            webhooks.map((webhook) => (
              <div
                key={webhook.id}
                className="p-4 rounded-lg border bg-card"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <Webhook className="w-5 h-5 text-foreground" />
                    <div>
                      <p className="text-sm font-medium text-foreground">{webhook.name}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <code className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded">
                          {webhook.url}
                        </code>
                        <button
                          onClick={() => copyToClipboard(webhook.url)}
                          className="p-1 hover:bg-accent rounded"
                        >
                          <Copy className="w-3 h-3 text-muted-foreground" />
                        </button>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {webhook.status === "active" ? (
                      <Badge variant="default" className="bg-success text-success-foreground">
                        <CheckCircle2 className="w-3 h-3 mr-1" />
                        Active
                      </Badge>
                    ) : (
                      <Badge variant="secondary">
                        <XCircle className="w-3 h-3 mr-1" />
                        Inactive
                      </Badge>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteWebhook(webhook.id)}
                    >
                      <Trash2 className="w-4 h-4 text-danger" />
                    </Button>
                  </div>
                </div>

                <div className="flex flex-wrap gap-1 mb-2">
                  {webhook.events.map((event) => (
                    <Badge key={event} variant="outline" className="text-xs">
                      {event}
                    </Badge>
                  ))}
                </div>

                {webhook.lastTriggered && (
                  <p className="text-xs text-muted-foreground">
                    Last triggered: {webhook.lastTriggered}
                  </p>
                )}
              </div>
            ))
          )}
        </div>
      </Card>
    </motion.div>
  );
}
