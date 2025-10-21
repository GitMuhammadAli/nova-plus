"use client"

import { AppLayout } from "@/components/layout/app-layout"
import { CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { AnimatedCard } from "@/components/motion/animated-card"
import { Plus, Trash2, Edit2 } from "lucide-react"

const teamMembers = [
  { id: 1, name: "Sarah Johnson", email: "sarah@example.com", role: "Owner", joinDate: "2024-01-15" },
  { id: 2, name: "Mike Chen", email: "mike@example.com", role: "Admin", joinDate: "2024-02-20" },
  { id: 3, name: "Emma Davis", email: "emma@example.com", role: "Editor", joinDate: "2024-03-10" },
]

export default function TeamSettingsPage() {
  return (
    <AppLayout title="Team Settings">
      <div className="space-y-8 max-w-4xl">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold text-foreground">Team Management</h2>
            <p className="text-muted-foreground mt-1">Manage team members and their roles</p>
          </div>
          <Button className="gap-2">
            <Plus className="w-4 h-4" />
            Invite Member
          </Button>
        </div>

        {/* Team Info */}
        <AnimatedCard delay={0.1}>
          <CardHeader>
            <CardTitle>Team Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium text-foreground">Team Name</label>
              <Input defaultValue="Acme Inc." className="mt-2" />
            </div>
            <div>
              <label className="text-sm font-medium text-foreground">Team Slug</label>
              <Input defaultValue="acme-inc" className="mt-2" disabled />
            </div>
            <Button>Save Changes</Button>
          </CardContent>
        </AnimatedCard>

        {/* Team Members */}
        <AnimatedCard delay={0.2}>
          <CardHeader>
            <CardTitle>Team Members</CardTitle>
            <CardDescription>{teamMembers.length} members in your team</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {teamMembers.map((member) => (
                <div key={member.id} className="flex items-center justify-between p-4 border border-border rounded-lg">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-sm font-bold">
                      {member.name
                        .split(" ")
                        .map((n) => n[0])
                        .join("")}
                    </div>
                    <div>
                      <p className="font-medium text-foreground">{member.name}</p>
                      <p className="text-sm text-muted-foreground">{member.email}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge variant="outline">{member.role}</Badge>
                    {member.role !== "Owner" && (
                      <>
                        <Button variant="ghost" size="icon">
                          <Edit2 className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="text-destructive">
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </AnimatedCard>

        {/* Roles & Permissions */}
        <AnimatedCard delay={0.3}>
          <CardHeader>
            <CardTitle>Roles & Permissions</CardTitle>
            <CardDescription>Define what each role can do</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[
                {
                  role: "Owner",
                  permissions: ["Full access", "Manage team", "Manage billing", "Delete workspace"],
                },
                {
                  role: "Admin",
                  permissions: ["Full access", "Manage team", "Manage billing"],
                },
                {
                  role: "Editor",
                  permissions: ["Create content", "Edit content", "View analytics"],
                },
                {
                  role: "Viewer",
                  permissions: ["View content", "View analytics"],
                },
              ].map((roleGroup, index) => (
                <div key={index} className="p-4 border border-border rounded-lg">
                  <p className="font-medium text-foreground mb-3">{roleGroup.role}</p>
                  <ul className="space-y-2">
                    {roleGroup.permissions.map((permission, pIndex) => (
                      <li key={pIndex} className="text-sm text-muted-foreground flex items-center gap-2">
                        <span className="w-1.5 h-1.5 bg-primary rounded-full" />
                        {permission}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </CardContent>
        </AnimatedCard>
      </div>
    </AppLayout>
  )
}
