 "use client";

import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch, RootState } from "@/app/store/store";
import { fetchCompanyUsers } from "@/app/store/usersSlice";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AnimatedCard } from "@/components/motion/animated-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Bell, Lock, Users, Zap, Building2, Globe, FileText, Image } from "lucide-react";
import { companyAPI } from "@/app/services";
import { useToast } from "@/hooks/use-toast";

export default function SettingsPage() {
  const dispatch = useDispatch<AppDispatch>();
  const { user } = useSelector((state: RootState) => state.auth);
  const { users } = useSelector((state: RootState) => state.users);
  const { toast } = useToast();

  const isCompanyAdmin = user?.role?.toLowerCase() === "company_admin";
  const companyId = user?.companyId;

  const [companyForm, setCompanyForm] = useState({
    name: "",
    domain: "",
    description: "",
    logoUrl: "",
  });
  const [companyInfo, setCompanyInfo] = useState<any>(null);
  const [companyLoading, setCompanyLoading] = useState(false);
  const [savingCompany, setSavingCompany] = useState(false);

  const [emailNotifications, setEmailNotifications] = useState(true);
  const [pushNotifications, setPushNotifications] = useState(false);
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(true);

  useEffect(() => {
    const loadCompany = async () => {
      if (!companyId || !isCompanyAdmin) return;
      setCompanyLoading(true);
      try {
        const response = await companyAPI.getById(companyId);
        const data = response.data;
        setCompanyInfo(data);
        setCompanyForm({
          name: data?.name || "",
          domain: data?.domain || "",
          description: data?.description || "",
          logoUrl: data?.logoUrl || "",
        });
        dispatch(fetchCompanyUsers({}));
      } catch (error: any) {
        console.error("Failed to load company", error);
        toast({
          title: "Error",
          description: "Unable to load company information.",
          variant: "destructive",
        });
      } finally {
        setCompanyLoading(false);
      }
    };

    loadCompany();
  }, [companyId, isCompanyAdmin, dispatch, toast]);

  const handleCompanyInputChange = (field: string, value: string) => {
    setCompanyForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSaveCompany = async () => {
    if (!companyId) return;
    setSavingCompany(true);
    try {
      await companyAPI.update(companyId, {
        name: companyForm.name,
        domain: companyForm.domain,
        description: companyForm.description,
        logoUrl: companyForm.logoUrl,
      });
      toast({ title: "Company updated", description: "Workspace settings saved successfully." });
      setCompanyInfo((prev: any) => ({ ...prev, ...companyForm }));
    } catch (error: any) {
      toast({
        title: "Error",
        description: error?.response?.data?.message || "Failed to update company.",
        variant: "destructive",
      });
    } finally {
      setSavingCompany(false);
    }
  };

  const totalUsers = users.length;
  const totalManagers = users.filter((u) => (u.role || "").toLowerCase() === "manager").length;
  const activeUsers = users.filter((u) => u.isActive !== false).length;

  return (
    <div className="space-y-8 max-w-5xl">
      <div>
        <h2 className="text-3xl font-bold text-foreground">Settings</h2>
        <p className="text-muted-foreground mt-1">
          Manage your company workspace and personal preferences
        </p>
      </div>

      {isCompanyAdmin && (
        <>
          <Card className="p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-xl font-semibold text-foreground">Company Profile</h3>
                <p className="text-sm text-muted-foreground">
                  Update how your workspace appears across NovaPulse
                </p>
              </div>
              {companyForm.logoUrl && (
                <div className="w-12 h-12 rounded-lg overflow-hidden border border-border bg-muted">
                  <img
                    src={companyForm.logoUrl}
                    alt="Company logo"
                    className="w-full h-full object-cover"
                  />
                </div>
              )}
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="text-sm font-medium text-foreground flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-muted-foreground" />
                  Company Name
                </label>
                <Input
                  className="mt-2"
                  value={companyForm.name}
                  onChange={(e) => handleCompanyInputChange("name", e.target.value)}
                  disabled={companyLoading}
                  placeholder="Acme Inc."
                />
              </div>
              <div>
                <label className="text-sm font-medium text-foreground flex items-center gap-2">
                  <Globe className="w-4 h-4 text-muted-foreground" />
                  Company Domain
                </label>
                <Input
                  className="mt-2"
                  value={companyForm.domain}
                  onChange={(e) => handleCompanyInputChange("domain", e.target.value)}
                  disabled={companyLoading}
                  placeholder="acme.com"
                />
              </div>
              <div className="md:col-span-2">
                <label className="text-sm font-medium text-foreground flex items-center gap-2">
                  <FileText className="w-4 h-4 text-muted-foreground" />
                  Description
                </label>
                <textarea
                  className="mt-2 w-full min-h-[120px] border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary p-3"
                  value={companyForm.description}
                  onChange={(e) => handleCompanyInputChange("description", e.target.value)}
                  placeholder="Tell your team what this workspace is all about..."
                  disabled={companyLoading}
                />
              </div>
              <div className="md:col-span-2">
                <label className="text-sm font-medium text-foreground flex items-center gap-2">
                  <Image className="w-4 h-4 text-muted-foreground" />
                  Logo URL
                </label>
                <Input
                  className="mt-2"
                  value={companyForm.logoUrl}
                  onChange={(e) => handleCompanyInputChange("logoUrl", e.target.value)}
                  disabled={companyLoading}
                  placeholder="https://..."
                />
              </div>
            </div>
            <div className="flex gap-3 justify-end mt-6">
              <Button variant="outline" disabled={companyLoading || savingCompany}>
                Cancel
              </Button>
              <Button onClick={handleSaveCompany} disabled={companyLoading || savingCompany}>
                {savingCompany ? "Saving..." : "Save Changes"}
              </Button>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <h3 className="text-lg font-semibold text-foreground">Workspace Overview</h3>
                <p className="text-sm text-muted-foreground">
                  Key stats for your NovaPulse workspace.
                </p>
              </div>
              <div className="text-sm text-muted-foreground">
                Workspace ID:{" "}
                <code className="px-2 py-1 rounded bg-muted text-foreground">
                  {companyInfo?._id || "—"}
                </code>
              </div>
            </div>
            <div className="grid gap-4 md:grid-cols-3 mt-6">
              <div className="p-4 border border-border rounded-lg">
                <p className="text-sm text-muted-foreground">Total Users</p>
                <p className="text-2xl font-bold">{totalUsers}</p>
              </div>
              <div className="p-4 border border-border rounded-lg">
                <p className="text-sm text-muted-foreground">Active Users</p>
                <p className="text-2xl font-bold text-green-600">{activeUsers}</p>
              </div>
              <div className="p-4 border border-border rounded-lg">
                <p className="text-sm text-muted-foreground">Managers</p>
                <p className="text-2xl font-bold text-primary">{totalManagers}</p>
              </div>
            </div>
            <div className="grid gap-4 md:grid-cols-2 mt-6">
              <div className="p-4 border border-border rounded-lg">
                <p className="text-sm text-muted-foreground">Workspace Created</p>
                <p className="text-base font-medium">
                  {companyInfo?.createdAt
                    ? new Date(companyInfo.createdAt).toLocaleDateString()
                    : "—"}
                </p>
              </div>
              <div className="p-4 border border-border rounded-lg">
                <p className="text-sm text-muted-foreground">Last Updated</p>
                <p className="text-base font-medium">
                  {companyInfo?.updatedAt
                    ? new Date(companyInfo.updatedAt).toLocaleDateString()
                    : "—"}
                </p>
              </div>
            </div>
          </Card>
        </>
      )}

      <AnimatedCard delay={0.1}>
        <Tabs defaultValue="account" className="w-full">
          <TabsList className="w-full justify-start border-b border-border rounded-none bg-transparent p-0">
            <TabsTrigger
              value="account"
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary"
            >
              <Users className="w-4 h-4 mr-2" />
              Account
            </TabsTrigger>
            <TabsTrigger
              value="notifications"
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary"
            >
              <Bell className="w-4 h-4 mr-2" />
              Notifications
            </TabsTrigger>
            <TabsTrigger
              value="security"
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary"
            >
              <Lock className="w-4 h-4 mr-2" />
              Security
            </TabsTrigger>
            <TabsTrigger
              value="integrations"
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary"
            >
              <Zap className="w-4 h-4 mr-2" />
              Integrations
            </TabsTrigger>
          </TabsList>

          <TabsContent value="account" className="space-y-6 mt-6">
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-foreground">Full Name</label>
                <Input defaultValue={user?.name || ""} className="mt-2" />
              </div>
              <div>
                <label className="text-sm font-medium text-foreground">Email Address</label>
                <Input defaultValue={user?.email || ""} type="email" className="mt-2" disabled />
              </div>
              <div>
                <label className="text-sm font-medium text-foreground">Company</label>
                <Input defaultValue={companyInfo?.name || ""} className="mt-2" disabled />
              </div>
              <div>
                <label className="text-sm font-medium text-foreground">Bio</label>
                <textarea
                  defaultValue=""
                  className="w-full mt-2 p-3 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                  rows={4}
                  placeholder="Tell others about yourself..."
                />
              </div>
            </div>
            <div className="flex gap-3">
              <Button>Save Changes</Button>
              <Button variant="outline" className="bg-transparent">
                Cancel
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="notifications" className="space-y-6 mt-6">
            <div className="space-y-4">
              {[
                {
                  title: "Email Notifications",
                  description: "Receive email updates about your account activity",
                  enabled: emailNotifications,
                  onChange: setEmailNotifications,
                },
                {
                  title: "Push Notifications",
                  description: "Receive push notifications on your devices",
                  enabled: pushNotifications,
                  onChange: setPushNotifications,
                },
              ].map((notification, index) => (
                <div key={index} className="flex items-center justify-between p-4 border border-border rounded-lg">
                  <div>
                    <p className="font-medium text-foreground">{notification.title}</p>
                    <p className="text-sm text-muted-foreground">{notification.description}</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={notification.enabled}
                    onChange={(e) => notification.onChange(e.target.checked)}
                    className="w-5 h-5 rounded border-border cursor-pointer"
                  />
                </div>
              ))}
            </div>
            <Button>Save Preferences</Button>
          </TabsContent>

          <TabsContent value="security" className="space-y-6 mt-6">
            <div className="space-y-4">
              <div className="p-4 border border-border rounded-lg">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <p className="font-medium text-foreground">Password</p>
                    <p className="text-sm text-muted-foreground">Last changed 3 months ago</p>
                  </div>
                  <Button variant="outline" className="bg-transparent">
                    Change Password
                  </Button>
                </div>
              </div>

              <div className="p-4 border border-border rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-foreground">Two-Factor Authentication</p>
                    <p className="text-sm text-muted-foreground">Add an extra layer of security</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={twoFactorEnabled ? "default" : "secondary"}>
                      {twoFactorEnabled ? "Enabled" : "Disabled"}
                    </Badge>
                    <Button
                      variant="outline"
                      className="bg-transparent"
                      onClick={() => setTwoFactorEnabled(!twoFactorEnabled)}
                    >
                      {twoFactorEnabled ? "Disable" : "Enable"}
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="integrations" className="space-y-6 mt-6">
            <div className="space-y-4">
              {[
                {
                  name: "Slack",
                  description: "Send notifications to your Slack workspace",
                  icon: "💬",
                  connected: true,
                },
                {
                  name: "Stripe",
                  description: "Manage payments and subscriptions",
                  icon: "💳",
                  connected: false,
                },
              ].map((integration, index) => (
                <div key={index} className="flex items-center justify-between p-4 border border-border rounded-lg">
                  <div className="flex items-center gap-4">
                    <span className="text-2xl">{integration.icon}</span>
                    <div>
                      <p className="font-medium text-foreground">{integration.name}</p>
                      <p className="text-sm text-muted-foreground">{integration.description}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {integration.connected && <Badge>Connected</Badge>}
                    <Button variant="outline" className="bg-transparent">
                      {integration.connected ? "Manage" : "Connect"}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </AnimatedCard>
    </div>
  );
}
