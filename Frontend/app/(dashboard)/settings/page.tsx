"use client";

import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch, RootState } from "@/app/store/store";
import { fetchCompanyUsers } from "@/app/store/usersSlice";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { AnimatedCard } from "@/components/motion/animated-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
  Bell,
  Lock,
  Users,
  Zap,
  Building2,
  Globe,
  FileText,
  Image,
  Clock,
} from "lucide-react";
import { companyAPI, settingsAPI } from "@/app/services";
import { useToast } from "@/hooks/use-toast";
import { useRolePermissions } from "@/hooks/useRolePermissions";

export default function SettingsPage() {
  const dispatch = useDispatch<AppDispatch>();
  const { user } = useSelector((state: RootState) => state.auth);
  const { users } = useSelector((state: RootState) => state.users);
  const { toast } = useToast();
  const { permissions, hasPermission } = useRolePermissions();

  const isCompanyAdmin = user?.role?.toLowerCase() === "company_admin";
  const companyId = user?.companyId;
  const canViewSettings = hasPermission("canViewSettings");
  const canEditSettings = hasPermission("canEditSettings");

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
  const [branding, setBranding] = useState({
    logo: "",
    primaryColor: "#3b82f6",
    secondaryColor: "#8b5cf6",
    companyName: "",
  });
  const [permissionsSettings, setPermissionsSettings] = useState<
    Record<string, any>
  >({});
  const [savingBranding, setSavingBranding] = useState(false);
  const [savingPermissions, setSavingPermissions] = useState(false);

  useEffect(() => {
    const loadCompany = async () => {
      if (!companyId || !isCompanyAdmin || !canViewSettings) return;
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
        // Silently handle error
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
    loadBranding();
    loadPermissions();
  }, [companyId, isCompanyAdmin, canViewSettings, dispatch, toast]);

  const loadBranding = async () => {
    if (!isCompanyAdmin || !canViewSettings) return;
    try {
      const response = await settingsAPI.getBranding();
      const brandingData = response.data?.settings || [];
      const brandingObj: any = {};
      brandingData.forEach((setting: any) => {
        brandingObj[setting.key] = setting.value;
      });
      setBranding({
        logo: brandingObj.logo || "",
        primaryColor: brandingObj.primaryColor || "#3b82f6",
        secondaryColor: brandingObj.secondaryColor || "#8b5cf6",
        companyName: brandingObj.companyName || companyInfo?.name || "",
      });
    } catch (error) {
      // Silently handle error
    }
  };

  const loadPermissions = async () => {
    if (!isCompanyAdmin) return;
    try {
      const response = await settingsAPI.getPermissions();
      const permissionsData = response.data?.settings || [];
      if (permissionsData.length > 0) {
        setPermissionsSettings(permissionsData[0].value || {});
      }
    } catch (error) {
      // Silently handle error
    }
  };

  const handleSaveBranding = async () => {
    setSavingBranding(true);
    try {
      await settingsAPI.updateBranding(branding);
      toast({
        title: "Success",
        description: "Branding settings saved successfully",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description:
          error?.response?.data?.message || "Failed to save branding",
        variant: "destructive",
      });
    } finally {
      setSavingBranding(false);
    }
  };

  const handleSavePermissions = async () => {
    setSavingPermissions(true);
    try {
      await settingsAPI.updatePermissions(permissions);
      toast({
        title: "Success",
        description: "Permissions updated successfully",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description:
          error?.response?.data?.message || "Failed to save permissions",
        variant: "destructive",
      });
    } finally {
      setSavingPermissions(false);
    }
  };

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
      toast({
        title: "Company updated",
        description: "Workspace settings saved successfully.",
      });
      setCompanyInfo((prev: any) => ({ ...prev, ...companyForm }));
    } catch (error: any) {
      toast({
        title: "Error",
        description:
          error?.response?.data?.message || "Failed to update company.",
        variant: "destructive",
      });
    } finally {
      setSavingCompany(false);
    }
  };

  const totalUsers = users.length;
  const totalManagers = users.filter(
    (u) => (u.role || "").toLowerCase() === "manager"
  ).length;
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
                <h3 className="text-xl font-semibold text-foreground">
                  Company Profile
                </h3>
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
                  onChange={(e) =>
                    handleCompanyInputChange("name", e.target.value)
                  }
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
                  onChange={(e) =>
                    handleCompanyInputChange("domain", e.target.value)
                  }
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
                  onChange={(e) =>
                    handleCompanyInputChange("description", e.target.value)
                  }
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
                  onChange={(e) =>
                    handleCompanyInputChange("logoUrl", e.target.value)
                  }
                  disabled={companyLoading}
                  placeholder="https://..."
                />
              </div>
            </div>
            <div className="flex gap-3 justify-end mt-6">
              <Button
                variant="outline"
                disabled={companyLoading || savingCompany}
              >
                Cancel
              </Button>
              <Button
                onClick={handleSaveCompany}
                disabled={companyLoading || savingCompany}
              >
                {savingCompany ? "Saving..." : "Save Changes"}
              </Button>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <h3 className="text-lg font-semibold text-foreground">
                  Workspace Overview
                </h3>
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
                <p className="text-2xl font-bold text-green-600">
                  {activeUsers}
                </p>
              </div>
              <div className="p-4 border border-border rounded-lg">
                <p className="text-sm text-muted-foreground">Managers</p>
                <p className="text-2xl font-bold text-primary">
                  {totalManagers}
                </p>
              </div>
            </div>
            <div className="grid gap-4 md:grid-cols-2 mt-6">
              <div className="p-4 border border-border rounded-lg">
                <p className="text-sm text-muted-foreground">
                  Workspace Created
                </p>
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
            {isCompanyAdmin && (
              <>
                <TabsTrigger
                  value="branding"
                  className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary"
                >
                  <Image className="w-4 h-4 mr-2" />
                  Branding
                </TabsTrigger>
                <TabsTrigger
                  value="permissions"
                  className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary"
                >
                  <Lock className="w-4 h-4 mr-2" />
                  Permissions
                </TabsTrigger>
                <TabsTrigger
                  value="work-hours"
                  className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary"
                >
                  <Clock className="w-4 h-4 mr-2" />
                  Work Hours
                </TabsTrigger>
              </>
            )}
          </TabsList>

          <TabsContent value="account" className="space-y-6 mt-6">
            <div className="space-y-4 p-6">
              <div>
                <label className="text-sm font-medium text-foreground">
                  Full Name
                </label>
                <Input defaultValue={user?.name || ""} className="mt-2" />
              </div>
              <div>
                <label className="text-sm font-medium text-foreground">
                  Email Address
                </label>
                <Input
                  defaultValue={user?.email || ""}
                  type="email"
                  className="mt-2"
                  disabled
                />
              </div>
              <div>
                <label className="text-sm font-medium text-foreground">
                  Company
                </label>
                <Input
                  defaultValue={companyInfo?.name || ""}
                  className="mt-2"
                  disabled
                />
              </div>
              <div>
                <label className="text-sm font-medium text-foreground">
                  Bio
                </label>
                <textarea
                  defaultValue=""
                  className="w-full mt-2 p-3 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                  rows={4}
                  placeholder="Tell others about yourself..."
                />
              </div>
            </div>
            <div className="flex gap-3 px-6 pb-6">
              <Button>Save Changes</Button>
              <Button variant="outline" className="bg-transparent">
                Cancel
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="notifications" className="space-y-6 mt-6">
            <Card className="p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-xl font-semibold text-foreground">
                    Notification Preferences
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Configure how and when you receive notifications
                  </p>
                </div>
              </div>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 border border-border rounded-lg">
                  <div>
                    <Label className="text-sm font-medium">
                      Email Notifications
                    </Label>
                    <p className="text-sm text-muted-foreground">
                      Receive email notifications for important updates
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      className="w-4 h-4 rounded border-border"
                      defaultChecked
                    />
                  </div>
                </div>
                <div className="flex items-center justify-between p-4 border border-border rounded-lg">
                  <div>
                    <Label className="text-sm font-medium">
                      Task Assignments
                    </Label>
                    <p className="text-sm text-muted-foreground">
                      Get notified when tasks are assigned to you
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      className="w-4 h-4 rounded border-border"
                      defaultChecked
                    />
                  </div>
                </div>
                <div className="flex items-center justify-between p-4 border border-border rounded-lg">
                  <div>
                    <Label className="text-sm font-medium">
                      Project Updates
                    </Label>
                    <p className="text-sm text-muted-foreground">
                      Receive updates about project changes
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      className="w-4 h-4 rounded border-border"
                      defaultChecked
                    />
                  </div>
                </div>
                <div className="flex items-center justify-between p-4 border border-border rounded-lg">
                  <div>
                    <Label className="text-sm font-medium">
                      Team Invitations
                    </Label>
                    <p className="text-sm text-muted-foreground">
                      Get notified when you're invited to join a team
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      className="w-4 h-4 rounded border-border"
                      defaultChecked
                    />
                  </div>
                </div>
                <div className="flex items-center justify-between p-4 border border-border rounded-lg">
                  <div>
                    <Label className="text-sm font-medium">
                      Weekly Reports
                    </Label>
                    <p className="text-sm text-muted-foreground">
                      Receive weekly summary reports
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      className="w-4 h-4 rounded border-border"
                    />
                  </div>
                </div>
              </div>
              <div className="flex gap-3 justify-end mt-6">
                <Button variant="outline">Cancel</Button>
                <Button>Save Preferences</Button>
              </div>
            </Card>
            <div className="space-y-4 p-6">
              {[
                {
                  title: "Email Notifications",
                  description:
                    "Receive email updates about your account activity",
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
                <div
                  key={index}
                  className="flex items-center justify-between p-4 border border-border rounded-lg"
                >
                  <div>
                    <p className="font-medium text-foreground">
                      {notification.title}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {notification.description}
                    </p>
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
            <div className="px-6 pb-6">
              <Button>Save Preferences</Button>
            </div>
          </TabsContent>

          <TabsContent value="security" className="space-y-6 mt-6">
            <div className="space-y-4">
              <div className="p-4 border border-border rounded-lg">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <p className="font-medium text-foreground">Password</p>
                    <p className="text-sm text-muted-foreground">
                      Last changed 3 months ago
                    </p>
                  </div>
                  <Button variant="outline" className="bg-transparent">
                    Change Password
                  </Button>
                </div>
              </div>

              <div className="p-4 border border-border rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-foreground">
                      Two-Factor Authentication
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Add an extra layer of security
                    </p>
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
                <div
                  key={index}
                  className="flex items-center justify-between p-4 border border-border rounded-lg"
                >
                  <div className="flex items-center gap-4">
                    <span className="text-2xl">{integration.icon}</span>
                    <div>
                      <p className="font-medium text-foreground">
                        {integration.name}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {integration.description}
                      </p>
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

          {isCompanyAdmin && (
            <>
              <TabsContent value="branding" className="space-y-6 mt-6">
                <div className="space-y-4 p-6">
                  <div>
                    <Label htmlFor="logo">Logo URL</Label>
                    <Input
                      id="logo"
                      value={branding.logo}
                      onChange={(e) =>
                        setBranding({ ...branding, logo: e.target.value })
                      }
                      placeholder="https://example.com/logo.png"
                      className="mt-2"
                    />
                  </div>
                  <div>
                    <Label htmlFor="primaryColor">Primary Color</Label>
                    <div className="flex gap-2 mt-2">
                      <Input
                        id="primaryColor"
                        type="color"
                        value={branding.primaryColor}
                        onChange={(e) =>
                          setBranding({
                            ...branding,
                            primaryColor: e.target.value,
                          })
                        }
                        className="w-20 h-10"
                      />
                      <Input
                        value={branding.primaryColor}
                        onChange={(e) =>
                          setBranding({
                            ...branding,
                            primaryColor: e.target.value,
                          })
                        }
                        placeholder="#3b82f6"
                        className="flex-1"
                      />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="secondaryColor">Secondary Color</Label>
                    <div className="flex gap-2 mt-2">
                      <Input
                        id="secondaryColor"
                        type="color"
                        value={branding.secondaryColor}
                        onChange={(e) =>
                          setBranding({
                            ...branding,
                            secondaryColor: e.target.value,
                          })
                        }
                        className="w-20 h-10"
                      />
                      <Input
                        value={branding.secondaryColor}
                        onChange={(e) =>
                          setBranding({
                            ...branding,
                            secondaryColor: e.target.value,
                          })
                        }
                        placeholder="#8b5cf6"
                        className="flex-1"
                      />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="companyName">Company Name (Display)</Label>
                    <Input
                      id="companyName"
                      value={branding.companyName}
                      onChange={(e) =>
                        setBranding({
                          ...branding,
                          companyName: e.target.value,
                        })
                      }
                      placeholder="Your Company Name"
                      className="mt-2"
                    />
                  </div>
                </div>
                <div className="px-6 pb-6">
                  <Button
                    onClick={handleSaveBranding}
                    disabled={savingBranding}
                  >
                    {savingBranding ? "Saving..." : "Save Branding"}
                  </Button>
                </div>
              </TabsContent>

              <TabsContent value="permissions" className="space-y-6 mt-6">
                <div className="space-y-4 p-6">
                  <div className="space-y-4">
                    <div>
                      <h4 className="font-medium mb-3">Role Permissions</h4>
                      <div className="space-y-3">
                        {["user", "manager", "company_admin"].map((role) => (
                          <Card key={role} className="p-4">
                            <div className="flex items-center justify-between mb-3">
                              <h5 className="font-medium capitalize">
                                {role.replace("_", " ")}
                              </h5>
                              <Badge variant="outline">{role}</Badge>
                            </div>
                            <div className="space-y-2">
                              {[
                                "create_users",
                                "edit_users",
                                "delete_users",
                                "create_projects",
                                "edit_projects",
                                "delete_projects",
                                "view_analytics",
                                "manage_settings",
                              ].map((permission) => (
                                <div
                                  key={permission}
                                  className="flex items-center justify-between"
                                >
                                  <Label
                                    htmlFor={`${role}-${permission}`}
                                    className="text-sm font-normal cursor-pointer"
                                  >
                                    {permission
                                      .replace("_", " ")
                                      .replace(/\b\w/g, (l) => l.toUpperCase())}
                                  </Label>
                                  <input
                                    type="checkbox"
                                    id={`${role}-${permission}`}
                                    checked={
                                      permissionsSettings[role]?.[permission] ||
                                      false
                                    }
                                    onChange={(e) => {
                                      setPermissionsSettings({
                                        ...permissionsSettings,
                                        [role]: {
                                          ...permissionsSettings[role],
                                          [permission]: e.target.checked,
                                        },
                                      });
                                    }}
                                    className="w-4 h-4 rounded border-border cursor-pointer"
                                  />
                                </div>
                              ))}
                            </div>
                          </Card>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
                <div className="px-6 pb-6">
                  <Button
                    onClick={handleSavePermissions}
                    disabled={savingPermissions}
                  >
                    {savingPermissions ? "Saving..." : "Save Permissions"}
                  </Button>
                </div>
              </TabsContent>

              <TabsContent value="work-hours" className="space-y-6 mt-6">
                <Card className="p-6">
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <h3 className="text-xl font-semibold text-foreground">
                        Work Hours
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        Set your default work hours and timezone
                      </p>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div className="grid gap-4 md:grid-cols-2">
                      <div>
                        <Label htmlFor="timezone">Timezone</Label>
                        <Select defaultValue="UTC">
                          <SelectTrigger id="timezone" className="mt-2">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="UTC">
                              UTC (Coordinated Universal Time)
                            </SelectItem>
                            <SelectItem value="America/New_York">
                              Eastern Time (ET)
                            </SelectItem>
                            <SelectItem value="America/Chicago">
                              Central Time (CT)
                            </SelectItem>
                            <SelectItem value="America/Denver">
                              Mountain Time (MT)
                            </SelectItem>
                            <SelectItem value="America/Los_Angeles">
                              Pacific Time (PT)
                            </SelectItem>
                            <SelectItem value="Europe/London">
                              London (GMT)
                            </SelectItem>
                            <SelectItem value="Europe/Paris">
                              Paris (CET)
                            </SelectItem>
                            <SelectItem value="Asia/Dubai">
                              Dubai (GST)
                            </SelectItem>
                            <SelectItem value="Asia/Tokyo">
                              Tokyo (JST)
                            </SelectItem>
                            <SelectItem value="Asia/Shanghai">
                              Shanghai (CST)
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label htmlFor="work-days">Work Days</Label>
                        <div className="flex gap-2 mt-2">
                          {[
                            "Mon",
                            "Tue",
                            "Wed",
                            "Thu",
                            "Fri",
                            "Sat",
                            "Sun",
                          ].map((day) => (
                            <Button
                              key={day}
                              variant="outline"
                              size="sm"
                              className="flex-1"
                            >
                              {day}
                            </Button>
                          ))}
                        </div>
                      </div>
                    </div>
                    <div className="grid gap-4 md:grid-cols-2">
                      <div>
                        <Label htmlFor="start-time">Start Time</Label>
                        <Input
                          id="start-time"
                          type="time"
                          defaultValue="09:00"
                          className="mt-2"
                        />
                      </div>
                      <div>
                        <Label htmlFor="end-time">End Time</Label>
                        <Input
                          id="end-time"
                          type="time"
                          defaultValue="17:00"
                          className="mt-2"
                        />
                      </div>
                    </div>
                    <div className="p-4 bg-muted rounded-lg">
                      <Label className="text-sm font-medium">Lunch Break</Label>
                      <div className="grid gap-4 md:grid-cols-2 mt-2">
                        <div>
                          <Label
                            htmlFor="lunch-start"
                            className="text-xs text-muted-foreground"
                          >
                            Start
                          </Label>
                          <Input
                            id="lunch-start"
                            type="time"
                            defaultValue="12:00"
                            className="mt-1"
                          />
                        </div>
                        <div>
                          <Label
                            htmlFor="lunch-end"
                            className="text-xs text-muted-foreground"
                          >
                            End
                          </Label>
                          <Input
                            id="lunch-end"
                            type="time"
                            defaultValue="13:00"
                            className="mt-1"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-3 justify-end mt-6">
                    <Button variant="outline">Cancel</Button>
                    <Button>Save Work Hours</Button>
                  </div>
                </Card>
              </TabsContent>
            </>
          )}
        </Tabs>
      </AnimatedCard>
    </div>
  );
}
