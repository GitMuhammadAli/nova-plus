"use client";

import { useState, useEffect } from "react";
import { useSelector } from "react-redux";
import { RootState } from "@/app/store/store";
import { AppShell } from "@/components/layout/AppShell";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { integrationsAPI } from "@/app/services";
import { toast } from "@/hooks/use-toast";
import {
  Mail,
  MessageSquare,
  Chrome,
  CheckCircle2,
  XCircle,
  Loader2,
  Plus,
  Trash2,
} from "lucide-react";

interface Integration {
  _id: string;
  type: string;
  name: string;
  isActive: boolean;
  createdAt: string;
}

export default function IntegrationsPage() {
  const { user } = useSelector((state: RootState) => state.auth);
  const [integrations, setIntegrations] = useState<Integration[]>([]);
  const [loading, setLoading] = useState(true);
  const [emailDialogOpen, setEmailDialogOpen] = useState(false);
  const [slackDialogOpen, setSlackDialogOpen] = useState(false);
  const [emailConfig, setEmailConfig] = useState({
    smtpHost: "",
    smtpPort: 587,
    username: "",
    password: "",
    to: "",
  });
  const [slackConfig, setSlackConfig] = useState({
    webhookUrl: "",
  });
  const [testing, setTesting] = useState(false);

  useEffect(() => {
    fetchIntegrations();
  }, []);

  const fetchIntegrations = async () => {
    setLoading(true);
    try {
      const response = await integrationsAPI.getAll();
      const data = response.data || response;
      setIntegrations(Array.isArray(data) ? data : []);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to load integrations",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleTestEmail = async () => {
    setTesting(true);
    try {
      await integrationsAPI.testEmail(emailConfig);
      toast({
        title: "Success",
        description: "Email integration test successful",
      });
      setEmailDialogOpen(false);
      fetchIntegrations();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.response?.data?.message || "Email test failed",
        variant: "destructive",
      });
    } finally {
      setTesting(false);
    }
  };

  const handleTestSlack = async () => {
    setTesting(true);
    try {
      await integrationsAPI.testSlack(slackConfig);
      toast({
        title: "Success",
        description: "Slack integration test successful",
      });
      setSlackDialogOpen(false);
      fetchIntegrations();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.response?.data?.message || "Slack test failed",
        variant: "destructive",
      });
    } finally {
      setTesting(false);
    }
  };

  const handleGoogleOAuth = async () => {
    try {
      const response = await integrationsAPI.startGoogleOAuth();
      const data = response.data || response;
      if (data.authUrl) {
        window.location.href = data.authUrl;
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to start Google OAuth",
        variant: "destructive",
      });
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this integration?")) return;

    try {
      await integrationsAPI.delete(id);
      toast({
        title: "Success",
        description: "Integration deleted successfully",
      });
      fetchIntegrations();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to delete integration",
        variant: "destructive",
      });
    }
  };

  const getIntegrationIcon = (type: string) => {
    switch (type) {
      case "email":
        return <Mail className="w-6 h-6" />;
      case "slack":
        return <MessageSquare className="w-6 h-6" />;
      case "google_oauth":
        return <Chrome className="w-6 h-6" />;
      default:
        return null;
    }
  };

  const getIntegrationName = (type: string) => {
    switch (type) {
      case "email":
        return "Email";
      case "slack":
        return "Slack";
      case "google_oauth":
        return "Google OAuth";
      default:
        return type;
    }
  };

  return (
    <AppShell>
      <div className="p-8 space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Integrations</h1>
          <p className="text-muted-foreground mt-1">
            Connect external services to enhance your workflow
          </p>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin" />
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {/* Email Integration */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-primary/10">
                      <Mail className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                      <CardTitle>Email</CardTitle>
                      <CardDescription>SMTP Configuration</CardDescription>
                    </div>
                  </div>
                  {integrations.find((i) => i.type === "email")?.isActive ? (
                    <CheckCircle2 className="w-5 h-5 text-success" />
                  ) : (
                    <XCircle className="w-5 h-5 text-muted-foreground" />
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">
                  Configure SMTP settings for email notifications
                </p>
                <Button
                  onClick={() => setEmailDialogOpen(true)}
                  className="w-full"
                  variant={integrations.find((i) => i.type === "email")?.isActive ? "outline" : "default"}
                >
                  {integrations.find((i) => i.type === "email")?.isActive ? "Update" : "Configure"}
                </Button>
              </CardContent>
            </Card>

            {/* Slack Integration */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-primary/10">
                      <MessageSquare className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                      <CardTitle>Slack</CardTitle>
                      <CardDescription>Webhook Integration</CardDescription>
                    </div>
                  </div>
                  {integrations.find((i) => i.type === "slack")?.isActive ? (
                    <CheckCircle2 className="w-5 h-5 text-success" />
                  ) : (
                    <XCircle className="w-5 h-5 text-muted-foreground" />
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">
                  Send notifications to Slack channels
                </p>
                <Button
                  onClick={() => setSlackDialogOpen(true)}
                  className="w-full"
                  variant={integrations.find((i) => i.type === "slack")?.isActive ? "outline" : "default"}
                >
                  {integrations.find((i) => i.type === "slack")?.isActive ? "Update" : "Configure"}
                </Button>
              </CardContent>
            </Card>

            {/* Google OAuth Integration */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-primary/10">
                      <Chrome className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                      <CardTitle>Google</CardTitle>
                      <CardDescription>OAuth Integration</CardDescription>
                    </div>
                  </div>
                  {integrations.find((i) => i.type === "google_oauth")?.isActive ? (
                    <CheckCircle2 className="w-5 h-5 text-success" />
                  ) : (
                    <XCircle className="w-5 h-5 text-muted-foreground" />
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">
                  Connect Google Calendar and Drive
                </p>
                <Button
                  onClick={handleGoogleOAuth}
                  className="w-full"
                  variant={integrations.find((i) => i.type === "google_oauth")?.isActive ? "outline" : "default"}
                >
                  {integrations.find((i) => i.type === "google_oauth")?.isActive ? "Reconnect" : "Connect"}
                </Button>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Active Integrations List */}
        {integrations.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Active Integrations</CardTitle>
              <CardDescription>Manage your connected services</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {integrations.map((integration) => (
                  <div
                    key={integration._id}
                    className="flex items-center justify-between p-4 rounded-lg border"
                  >
                    <div className="flex items-center gap-3">
                      {getIntegrationIcon(integration.type)}
                      <div>
                        <p className="font-medium">{getIntegrationName(integration.type)}</p>
                        <p className="text-sm text-muted-foreground">
                          Connected {new Date(integration.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={integration.isActive ? "default" : "secondary"}>
                        {integration.isActive ? "Active" : "Inactive"}
                      </Badge>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleDelete(integration._id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Email Configuration Dialog */}
        <Dialog open={emailDialogOpen} onOpenChange={setEmailDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Configure Email Integration</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>SMTP Host</Label>
                <Input
                  value={emailConfig.smtpHost}
                  onChange={(e) =>
                    setEmailConfig({ ...emailConfig, smtpHost: e.target.value })
                  }
                  placeholder="smtp.gmail.com"
                />
              </div>
              <div>
                <Label>SMTP Port</Label>
                <Input
                  type="number"
                  value={emailConfig.smtpPort}
                  onChange={(e) =>
                    setEmailConfig({ ...emailConfig, smtpPort: parseInt(e.target.value) })
                  }
                />
              </div>
              <div>
                <Label>Username</Label>
                <Input
                  value={emailConfig.username}
                  onChange={(e) =>
                    setEmailConfig({ ...emailConfig, username: e.target.value })
                  }
                  placeholder="your-email@gmail.com"
                />
              </div>
              <div>
                <Label>Password</Label>
                <Input
                  type="password"
                  value={emailConfig.password}
                  onChange={(e) =>
                    setEmailConfig({ ...emailConfig, password: e.target.value })
                  }
                  placeholder="Your SMTP password"
                />
              </div>
              <div>
                <Label>Test Email To</Label>
                <Input
                  value={emailConfig.to}
                  onChange={(e) =>
                    setEmailConfig({ ...emailConfig, to: e.target.value })
                  }
                  placeholder="test@example.com"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setEmailDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleTestEmail} disabled={testing}>
                {testing ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Testing...
                  </>
                ) : (
                  "Test & Save"
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Slack Configuration Dialog */}
        <Dialog open={slackDialogOpen} onOpenChange={setSlackDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Configure Slack Integration</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Webhook URL</Label>
                <Input
                  value={slackConfig.webhookUrl}
                  onChange={(e) =>
                    setSlackConfig({ ...slackConfig, webhookUrl: e.target.value })
                  }
                  placeholder="https://hooks.slack.com/services/..."
                />
                <p className="text-sm text-muted-foreground mt-1">
                  Create a webhook in your Slack workspace settings
                </p>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setSlackDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleTestSlack} disabled={testing}>
                {testing ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Testing...
                  </>
                ) : (
                  "Test & Save"
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AppShell>
  );
}

