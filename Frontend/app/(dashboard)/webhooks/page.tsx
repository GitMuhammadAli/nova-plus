"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import {
  Search,
  Plus,
  Trash2,
  Edit,
  TestTube,
  ExternalLink,
  Copy,
  CheckCircle2,
  XCircle,
  Clock,
  Loader2,
  Eye,
} from "lucide-react";
import { webhookAPI } from "@/app/services";
import { format } from "date-fns";
import { RoleGuard } from "@/components/auth/role-guard";
import { UserRole } from "@/types/user";
import { Checkbox } from "@/components/ui/checkbox";

interface Webhook {
  _id: string;
  url: string;
  events: string[];
  secret: string;
  retries: number;
  isActive: boolean;
  lastStatus?: string;
  lastAttemptAt?: string;
  createdAt: string;
  createdBy?: {
    _id: string;
    name: string;
    email: string;
  };
}

interface WebhookLog {
  _id: string;
  event: string;
  status: string;
  statusCode?: number;
  errorMessage?: string;
  attempt: number;
  deliveredAt?: string;
  duration?: number;
  createdAt: string;
}

const AVAILABLE_EVENTS = [
  'task.created',
  'task.updated',
  'task.deleted',
  'user.created',
  'user.updated',
  'user.deleted',
  'project.created',
  'project.updated',
  'project.deleted',
  'workflow.executed',
  'workflow.failed',
  'webhook.test',
];

export default function WebhooksPage() {
  const { toast } = useToast();
  const [webhooks, setWebhooks] = useState<Webhook[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [logsDialogOpen, setLogsDialogOpen] = useState(false);
  const [selectedWebhook, setSelectedWebhook] = useState<Webhook | null>(null);
  const [webhookLogs, setWebhookLogs] = useState<WebhookLog[]>([]);
  const [searchQuery, setSearchQuery] = useState("");

  const [newWebhook, setNewWebhook] = useState({
    url: "",
    events: [] as string[],
    retries: 3,
    isActive: true,
  });

  useEffect(() => {
    fetchWebhooks();
  }, []);

  const fetchWebhooks = async () => {
    try {
      setIsLoading(true);
      const response = await webhookAPI.getAll();
      const data = response.data?.data || response.data?.webhooks || response.data || [];
      setWebhooks(Array.isArray(data) ? data : []);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to fetch webhooks",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateWebhook = async () => {
    if (!newWebhook.url || newWebhook.events.length === 0) {
      toast({
        title: "Validation Error",
        description: "URL and at least one event are required",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsLoading(true);
      const response = await webhookAPI.create(newWebhook);
      const webhook = response.data?.data?.webhook || response.data?.webhook || response.data;
      toast({
        title: "Success",
        description: "Webhook created successfully",
      });
      setCreateDialogOpen(false);
      setNewWebhook({ url: "", events: [], retries: 3, isActive: true });
      fetchWebhooks();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to create webhook",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteWebhook = async () => {
    if (!selectedWebhook) return;

    try {
      setIsLoading(true);
      await webhookAPI.delete(selectedWebhook._id);
      toast({
        title: "Success",
        description: "Webhook deleted successfully",
      });
      setDeleteDialogOpen(false);
      setSelectedWebhook(null);
      fetchWebhooks();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to delete webhook",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleTestWebhook = async (webhook: Webhook) => {
    try {
      setIsLoading(true);
      await webhookAPI.test(webhook._id);
      toast({
        title: "Success",
        description: "Test webhook enqueued. Check logs for delivery status.",
      });
      fetchWebhooks();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to test webhook",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleViewLogs = async (webhook: Webhook) => {
    try {
      setIsLoading(true);
      const response = await webhookAPI.getLogs(webhook._id, 50);
      const logs = response.data?.data?.logs || response.data?.logs || response.data || [];
      setWebhookLogs(Array.isArray(logs) ? logs : []);
      setSelectedWebhook(webhook);
      setLogsDialogOpen(true);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to fetch logs",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleEvent = (event: string) => {
    setNewWebhook((prev) => ({
      ...prev,
      events: prev.events.includes(event)
        ? prev.events.filter((e) => e !== event)
        : [...prev.events, event],
    }));
  };

  const filteredWebhooks = webhooks.filter((webhook) =>
    webhook.url.toLowerCase().includes(searchQuery.toLowerCase()) ||
    webhook.events.some((e) => e.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const getStatusBadge = (webhook: Webhook) => {
    if (!webhook.isActive) {
      return <Badge variant="secondary">Inactive</Badge>;
    }
    if (webhook.lastStatus === "success") {
      return <Badge className="bg-green-500 hover:bg-green-600">Active</Badge>;
    }
    if (webhook.lastStatus === "failed") {
      return <Badge variant="destructive">Failed</Badge>;
    }
    return <Badge className="bg-blue-500 hover:bg-blue-600">Pending</Badge>;
  };

  return (
    <RoleGuard requiredRoles={[UserRole.COMPANY_ADMIN, UserRole.SUPER_ADMIN, UserRole.MANAGER]}>
      <div className="space-y-6 p-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="flex justify-between items-center"
        >
          <div>
            <h1 className="text-3xl font-bold text-foreground">Webhooks</h1>
            <p className="text-muted-foreground mt-1">
              Manage webhooks to receive real-time notifications
            </p>
          </div>
          <Button onClick={() => setCreateDialogOpen(true)} className="flex items-center">
            <Plus className="w-4 h-4 mr-2" /> Create Webhook
          </Button>
        </motion.div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search webhooks by URL or event..."
            className="pl-9"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        {/* Webhooks Table */}
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>URL</TableHead>
                <TableHead>Events</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Retries</TableHead>
                <TableHead>Last Attempt</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin text-primary mx-auto" />
                    <p className="mt-2 text-muted-foreground">Loading webhooks...</p>
                  </TableCell>
                </TableRow>
              ) : filteredWebhooks.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                    No webhooks found
                  </TableCell>
                </TableRow>
              ) : (
                filteredWebhooks.map((webhook) => (
                  <TableRow key={webhook._id}>
                    <TableCell className="font-medium max-w-xs truncate">{webhook.url}</TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {webhook.events.slice(0, 2).map((event) => (
                          <Badge key={event} variant="outline" className="text-xs">
                            {event}
                          </Badge>
                        ))}
                        {webhook.events.length > 2 && (
                          <Badge variant="outline" className="text-xs">
                            +{webhook.events.length - 2}
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>{getStatusBadge(webhook)}</TableCell>
                    <TableCell>{webhook.retries}</TableCell>
                    <TableCell>
                      {webhook.lastAttemptAt
                        ? format(new Date(webhook.lastAttemptAt), "MMM d, yyyy HH:mm")
                        : "Never"}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleViewLogs(webhook)}
                        >
                          <Eye className="w-4 h-4 mr-2" /> Logs
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleTestWebhook(webhook)}
                          disabled={!webhook.isActive}
                        >
                          <TestTube className="w-4 h-4 mr-2" /> Test
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => {
                            setSelectedWebhook(webhook);
                            setDeleteDialogOpen(true);
                          }}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </Card>

        {/* Create Webhook Dialog */}
        <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create New Webhook</DialogTitle>
              <DialogDescription>
                Configure a webhook to receive real-time notifications for events in your system.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="webhookUrl">Webhook URL *</Label>
                <Input
                  id="webhookUrl"
                  type="url"
                  placeholder="https://example.com/webhook"
                  value={newWebhook.url}
                  onChange={(e) => setNewWebhook({ ...newWebhook, url: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label>Events *</Label>
                <div className="grid grid-cols-2 gap-2 max-h-60 overflow-y-auto border rounded-md p-4">
                  {AVAILABLE_EVENTS.map((event) => (
                    <div key={event} className="flex items-center space-x-2">
                      <Checkbox
                        id={`event-${event}`}
                        checked={newWebhook.events.includes(event)}
                        onCheckedChange={() => handleToggleEvent(event)}
                      />
                      <Label
                        htmlFor={`event-${event}`}
                        className="text-sm font-normal cursor-pointer"
                      >
                        {event}
                      </Label>
                    </div>
                  ))}
                </div>
                <p className="text-xs text-muted-foreground">
                  Selected: {newWebhook.events.length} event(s)
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="retries">Retries</Label>
                <Input
                  id="retries"
                  type="number"
                  min={1}
                  max={10}
                  value={newWebhook.retries}
                  onChange={(e) =>
                    setNewWebhook({ ...newWebhook, retries: parseInt(e.target.value) || 3 })
                  }
                />
                <p className="text-xs text-muted-foreground">
                  Number of retry attempts if delivery fails
                </p>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="isActive"
                  checked={newWebhook.isActive}
                  onCheckedChange={(checked) =>
                    setNewWebhook({ ...newWebhook, isActive: checked === true })
                  }
                />
                <Label htmlFor="isActive" className="cursor-pointer">
                  Active (webhook will receive events)
                </Label>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreateWebhook} disabled={isLoading}>
                {isLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                Create Webhook
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Delete Webhook Dialog */}
        <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
              <AlertDialogDescription>
                This action will permanently delete the webhook for{" "}
                <span className="font-semibold">{selectedWebhook?.url}</span>. This action cannot
                be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleDeleteWebhook} disabled={isLoading}>
                {isLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Logs Dialog */}
        <Dialog open={logsDialogOpen} onOpenChange={setLogsDialogOpen}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Webhook Delivery Logs</DialogTitle>
              <DialogDescription>
                Recent delivery attempts for {selectedWebhook?.url}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              {webhookLogs.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">No logs available</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Event</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Attempt</TableHead>
                      <TableHead>Status Code</TableHead>
                      <TableHead>Duration</TableHead>
                      <TableHead>Delivered At</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {webhookLogs.map((log) => (
                      <TableRow key={log._id}>
                        <TableCell className="font-medium">{log.event}</TableCell>
                        <TableCell>
                          {log.status === "success" ? (
                            <Badge className="bg-green-500 hover:bg-green-600">Success</Badge>
                          ) : (
                            <Badge variant="destructive">Failed</Badge>
                          )}
                        </TableCell>
                        <TableCell>{log.attempt}</TableCell>
                        <TableCell>{log.statusCode || "N/A"}</TableCell>
                        <TableCell>{log.duration ? `${log.duration}ms` : "N/A"}</TableCell>
                        <TableCell>
                          {log.deliveredAt
                            ? format(new Date(log.deliveredAt), "MMM d, yyyy HH:mm:ss")
                            : "N/A"}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </div>
            <DialogFooter>
              <Button onClick={() => setLogsDialogOpen(false)}>Close</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </RoleGuard>
  );
}

