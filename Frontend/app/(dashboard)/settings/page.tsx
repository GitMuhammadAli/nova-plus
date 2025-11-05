"use client"

import { useState } from "react"
import { CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { AnimatedCard } from "@/components/motion/animated-card"
import { Badge } from "@/components/ui/badge"
import { Bell, Lock, Users, Zap } from "lucide-react"

export default function SettingsPage() {
  const [emailNotifications, setEmailNotifications] = useState(true)
  const [pushNotifications, setPushNotifications] = useState(false)
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(true)

  return (
      <div className="space-y-8 max-w-4xl">
        {/* Header */}
        <div>
          <h2 className="text-3xl font-bold text-foreground">Settings</h2>
          <p className="text-muted-foreground mt-1">Manage your account and preferences</p>
        </div>

        {/* Settings Tabs */}
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

            {/* Account Tab */}
            <TabsContent value="account" className="space-y-6 mt-6">
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-foreground">Full Name</label>
                  <Input defaultValue="John Doe" className="mt-2" />
                </div>
                <div>
                  <label className="text-sm font-medium text-foreground">Email Address</label>
                  <Input defaultValue="john@example.com" type="email" className="mt-2" />
                </div>
                <div>
                  <label className="text-sm font-medium text-foreground">Company</label>
                  <Input defaultValue="Acme Inc." className="mt-2" />
                </div>
                <div>
                  <label className="text-sm font-medium text-foreground">Bio</label>
                  <textarea
                    defaultValue="Product Manager with 5+ years of experience"
                    className="w-full mt-2 p-3 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                    rows={4}
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

            {/* Notifications Tab */}
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
                  {
                    title: "Weekly Digest",
                    description: "Get a weekly summary of your activity",
                    enabled: true,
                    onChange: () => {},
                  },
                  {
                    title: "Marketing Emails",
                    description: "Receive updates about new features and offers",
                    enabled: false,
                    onChange: () => {},
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

            {/* Security Tab */}
            <TabsContent value="security" className="space-y-6 mt-6">
              <div className="space-y-4">
                {/* Password */}
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

                {/* Two-Factor Authentication */}
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

                {/* Active Sessions */}
                <div className="p-4 border border-border rounded-lg">
                  <p className="font-medium text-foreground mb-4">Active Sessions</p>
                  <div className="space-y-3">
                    {[
                      { device: "Chrome on macOS", location: "San Francisco, CA", lastActive: "Now" },
                      { device: "Safari on iPhone", location: "San Francisco, CA", lastActive: "2 hours ago" },
                      { device: "Firefox on Windows", location: "New York, NY", lastActive: "1 day ago" },
                    ].map((session, index) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                        <div>
                          <p className="text-sm font-medium text-foreground">{session.device}</p>
                          <p className="text-xs text-muted-foreground">
                            {session.location} • {session.lastActive}
                          </p>
                        </div>
                        <Button variant="ghost" size="sm" className="text-destructive">
                          Sign Out
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </TabsContent>

            {/* Integrations Tab */}
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
                    name: "GitHub",
                    description: "Connect your GitHub repositories",
                    icon: "🐙",
                    connected: false,
                  },
                  {
                    name: "Zapier",
                    description: "Automate workflows with Zapier",
                    icon: "⚡",
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

        {/* Danger Zone */}
        <AnimatedCard delay={0.2} className="border-destructive/50 bg-destructive/5">
          <CardHeader>
            <CardTitle className="text-destructive">Danger Zone</CardTitle>
            <CardDescription>Irreversible actions</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-4 border border-destructive/50 rounded-lg">
              <p className="font-medium text-foreground mb-2">Delete Account</p>
              <p className="text-sm text-muted-foreground mb-4">
                Permanently delete your account and all associated data. This action cannot be undone.
              </p>
              <Button variant="outline" className="text-destructive bg-transparent border-destructive/50">
                Delete Account
              </Button>
            </div>
          </CardContent>
        </AnimatedCard>
      </div>
  )
}
