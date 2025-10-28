"use client"

import { AppLayout } from "@/components/layout/app-layout"
import { CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { AnimatedCard } from "@/components/motion/animated-card"
import { ArrowLeft, Mail, Phone, MapPin, Calendar, Activity } from "lucide-react"
import Link from "next/link"

export default function UserDetailPage({ params }: { params: { id: string } }) {
  // Mock user data - in real app, fetch based on params.id
  const user = {
    id: params.id,
    name: "Sarah Johnson",
    email: "sarah@example.com",
    phone: "+1 (555) 123-4567",
    location: "San Francisco, CA",
    role: "Admin",
    status: "active",
    joinDate: "2024-01-15",
    lastActive: "2 hours ago",
    avatar: "SJ",
    bio: "Product Manager with 5+ years of experience",
    permissions: ["read", "write", "delete", "manage_users"],
    activityLog: [
      { action: "Logged in", time: "2 hours ago" },
      { action: "Updated profile", time: "1 day ago" },
      { action: "Created new project", time: "3 days ago" },
      { action: "Invited team member", time: "1 week ago" },
    ],
  }

  return (
    <AppLayout title={user.name}>
      <div className="space-y-8">
        {/* Back Button */}
        <Link
          href="/users"
          className="inline-flex items-center gap-2 text-primary hover:text-primary/80 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Users
        </Link>

        {/* User Header */}
        <AnimatedCard delay={0.1}>
          <CardContent className="pt-6">
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-4">
                <div className="w-16 h-16 rounded-lg bg-primary flex items-center justify-center text-primary-foreground text-2xl font-bold">
                  {user.avatar}
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-foreground">{user.name}</h1>
                  <p className="text-muted-foreground">{user.bio}</p>
                  <div className="flex items-center gap-4 mt-3">
                    <Badge>{user.role}</Badge>
                    <Badge variant={user.status === "active" ? "default" : "secondary"}>{user.status}</Badge>
                  </div>
                </div>
              </div>
              <div className="flex gap-2">
                <Button variant="outline">Edit</Button>
                <Button variant="outline" className="text-destructive bg-transparent">
                  Remove
                </Button>
              </div>
            </div>
          </CardContent>
        </AnimatedCard>

        {/* User Info Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <AnimatedCard delay={0.2}>
            <CardContent className="pt-6">
              <div className="flex items-start gap-3">
                <Mail className="w-5 h-5 text-primary mt-1" />
                <div>
                  <p className="text-xs text-muted-foreground">Email</p>
                  <p className="font-medium text-foreground">{user.email}</p>
                </div>
              </div>
            </CardContent>
          </AnimatedCard>

          <AnimatedCard delay={0.3}>
            <CardContent className="pt-6">
              <div className="flex items-start gap-3">
                <Phone className="w-5 h-5 text-primary mt-1" />
                <div>
                  <p className="text-xs text-muted-foreground">Phone</p>
                  <p className="font-medium text-foreground">{user.phone}</p>
                </div>
              </div>
            </CardContent>
          </AnimatedCard>

          <AnimatedCard delay={0.4}>
            <CardContent className="pt-6">
              <div className="flex items-start gap-3">
                <MapPin className="w-5 h-5 text-primary mt-1" />
                <div>
                  <p className="text-xs text-muted-foreground">Location</p>
                  <p className="font-medium text-foreground">{user.location}</p>
                </div>
              </div>
            </CardContent>
          </AnimatedCard>

          <AnimatedCard delay={0.5}>
            <CardContent className="pt-6">
              <div className="flex items-start gap-3">
                <Calendar className="w-5 h-5 text-primary mt-1" />
                <div>
                  <p className="text-xs text-muted-foreground">Joined</p>
                  <p className="font-medium text-foreground">{user.joinDate}</p>
                </div>
              </div>
            </CardContent>
          </AnimatedCard>
        </div>

        {/* Tabs */}
        <AnimatedCard delay={0.6}>
          <CardHeader>
            <CardTitle>User Details</CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="permissions" className="w-full">
              <TabsList>
                <TabsTrigger value="permissions">Permissions</TabsTrigger>
                <TabsTrigger value="activity">Activity</TabsTrigger>
              </TabsList>

              {/* Permissions Tab */}
              <TabsContent value="permissions" className="space-y-4">
                <div className="space-y-3">
                  {[
                    { name: "Read", description: "Can view all content", enabled: true },
                    { name: "Write", description: "Can create and edit content", enabled: true },
                    { name: "Delete", description: "Can delete content", enabled: true },
                    { name: "Manage Users", description: "Can manage team members", enabled: true },
                    { name: "Manage Billing", description: "Can manage billing and subscriptions", enabled: false },
                  ].map((permission, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-4 border border-border rounded-lg hover:bg-muted/50 transition-colors"
                    >
                      <div>
                        <p className="font-medium text-foreground">{permission.name}</p>
                        <p className="text-sm text-muted-foreground">{permission.description}</p>
                      </div>
                      <input
                        type="checkbox"
                        checked={permission.enabled}
                        readOnly
                        className="w-5 h-5 rounded border-border"
                      />
                    </div>
                  ))}
                </div>
              </TabsContent>

              {/* Activity Tab */}
              <TabsContent value="activity" className="space-y-4">
                <div className="space-y-3">
                  {user.activityLog.map((log, index) => (
                    <div key={index} className="flex items-center gap-4 p-4 border border-border rounded-lg">
                      <Activity className="w-5 h-5 text-primary" />
                      <div className="flex-1">
                        <p className="font-medium text-foreground">{log.action}</p>
                        <p className="text-sm text-muted-foreground">{log.time}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </AnimatedCard>
      </div>
    </AppLayout>
  )
}
