import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { WorkflowNode } from "@/types/automation";

interface NodeConfigDialogProps {
  node: WorkflowNode | null;
  open: boolean;
  onClose: () => void;
  onSave: (config: Record<string, any>) => void;
}

export function NodeConfigDialog({ node, open, onClose, onSave }: NodeConfigDialogProps) {
  const [config, setConfig] = useState<Record<string, any>>({});

  useEffect(() => {
    if (node) {
      setConfig(node.config || {});
    }
  }, [node]);

  const handleSave = () => {
    onSave(config);
    onClose();
  };

  if (!node) return null;

  const renderConfigFields = () => {
    if (node.type === "trigger") {
      switch (node.triggerType) {
        case "schedule":
          return (
            <>
              <div className="space-y-2">
                <Label>Schedule Type</Label>
                <Select 
                  value={config.scheduleType || "interval"} 
                  onValueChange={(v) => setConfig({ ...config, scheduleType: v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="interval">Interval</SelectItem>
                    <SelectItem value="cron">Cron Expression</SelectItem>
                    <SelectItem value="daily">Daily</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Value</Label>
                <Input 
                  value={config.scheduleValue || ""} 
                  onChange={(e) => setConfig({ ...config, scheduleValue: e.target.value })}
                  placeholder="e.g., 5m, 0 9 * * *, etc."
                />
              </div>
            </>
          );

        case "webhook":
          return (
            <div className="space-y-2">
              <Label>Webhook URL</Label>
              <Input 
                value={config.webhookUrl || ""} 
                onChange={(e) => setConfig({ ...config, webhookUrl: e.target.value })}
                placeholder="https://example.com/webhook"
              />
            </div>
          );

        default:
          return (
            <div className="space-y-2">
              <Label>Filter Conditions (Optional)</Label>
              <Textarea 
                value={config.filter || ""} 
                onChange={(e) => setConfig({ ...config, filter: e.target.value })}
                placeholder="e.g., user.plan === 'premium'"
                rows={3}
              />
            </div>
          );
      }
    }

    if (node.type === "action") {
      switch (node.actionType) {
        case "send_email":
          return (
            <>
              <div className="space-y-2">
                <Label>Recipient</Label>
                <Input 
                  value={config.recipient || ""} 
                  onChange={(e) => setConfig({ ...config, recipient: e.target.value })}
                  placeholder="user.email or {{user.email}}"
                />
              </div>
              <div className="space-y-2">
                <Label>Subject</Label>
                <Input 
                  value={config.subject || ""} 
                  onChange={(e) => setConfig({ ...config, subject: e.target.value })}
                  placeholder="Email subject"
                />
              </div>
              <div className="space-y-2">
                <Label>Template</Label>
                <Select 
                  value={config.template || ""} 
                  onValueChange={(v) => setConfig({ ...config, template: v })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select template" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="welcome">Welcome Email</SelectItem>
                    <SelectItem value="confirmation">Confirmation Email</SelectItem>
                    <SelectItem value="notification">Notification Email</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </>
          );

        case "send_sms":
          return (
            <div className="space-y-2">
              <Label>Phone Number</Label>
              <Input 
                value={config.phone || ""} 
                onChange={(e) => setConfig({ ...config, phone: e.target.value })}
                placeholder="user.phone or {{user.phone}}"
              />
              <Label>SMS Message</Label>
              <Textarea 
                value={config.message || ""} 
                onChange={(e) => setConfig({ ...config, message: e.target.value })}
                placeholder="Your SMS message..."
                rows={3}
              />
            </div>
          );

        case "call_webhook":
          return (
            <>
              <div className="space-y-2">
                <Label>Webhook URL</Label>
                <Input 
                  value={config.url || ""} 
                  onChange={(e) => setConfig({ ...config, url: e.target.value })}
                  placeholder="https://api.example.com/endpoint"
                />
              </div>
              <div className="space-y-2">
                <Label>HTTP Method</Label>
                <Select 
                  value={config.method || "POST"} 
                  onValueChange={(v) => setConfig({ ...config, method: v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="GET">GET</SelectItem>
                    <SelectItem value="POST">POST</SelectItem>
                    <SelectItem value="PUT">PUT</SelectItem>
                    <SelectItem value="DELETE">DELETE</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </>
          );

        case "update_record":
          return (
            <>
              <div className="space-y-2">
                <Label>Table</Label>
                <Input 
                  value={config.table || ""} 
                  onChange={(e) => setConfig({ ...config, table: e.target.value })}
                  placeholder="users, orders, etc."
                />
              </div>
              <div className="space-y-2">
                <Label>Fields (JSON)</Label>
                <Textarea 
                  value={config.fields || ""} 
                  onChange={(e) => setConfig({ ...config, fields: e.target.value })}
                  placeholder='{"status": "active", "lastSeen": "now()"}'
                  rows={3}
                />
              </div>
            </>
          );

        default:
          return (
            <div className="space-y-2">
              <Label>Configuration (JSON)</Label>
              <Textarea 
                value={JSON.stringify(config, null, 2)} 
                onChange={(e) => {
                  try {
                    setConfig(JSON.parse(e.target.value));
                  } catch {}
                }}
                rows={4}
              />
            </div>
          );
      }
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Configure Node</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          {renderConfigFields()}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSave}>Save Configuration</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
