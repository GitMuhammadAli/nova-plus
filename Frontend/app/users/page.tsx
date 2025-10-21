"use client"

import { useState } from "react"
import { AppLayout } from "@/components/layout/app-layout"
import { CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { AnimatedCard } from "@/components/motion/animated-card"
import { Plus, Search, MoreHorizontal } from "lucide-react"

const usersData = [
  {
    id: 1,
    name: "Sarah Johnson",
    email: "sarah@example.com",
    role: "Admin",
    status: "active",
    joinDate: "2024-01-15",
    avatar: "SJ",
  },
  {
    id: 2,
    name: "Mike Chen",
    email: "mike@example.com",
    role: "Editor",
    status: "active",
    joinDate: "2024-02-20",
    avatar: "MC",
  },
  {
    id: 3,
    name: "Emma Davis",
    email: "emma@example.com",
    role: "Viewer",
    status: "inactive",
    joinDate: "2024-03-10",
    avatar: "ED",
  },
  {
    id: 4,
    name: "Alex Rodriguez",
    email: "alex@example.com",
    role: "Editor",
    status: "active",
    joinDate: "2024-01-25",
    avatar: "AR",
  },
  {
    id: 5,
    name: "Lisa Wang",
    email: "lisa@example.com",
    role: "Admin",
    status: "active",
    joinDate: "2024-02-05",
    avatar: "LW",
  },
]

export default function UsersPage() {
  const [searchQuery, setSearchQuery] = useState("")

  const filteredUsers = usersData.filter(
    (user) =>
      user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  return (
    <AppLayout title="Users">
      <div className="space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold text-foreground">User Management</h2>
            <p className="text-muted-foreground mt-1">Manage team members and their permissions</p>
          </div>
          <Button className="gap-2">
            <Plus className="w-4 h-4" />
            Add User
          </Button>
        </div>

        {/* Search and Filters */}
        <AnimatedCard delay={0.1}>
          <CardContent className="pt-6">
            <div className="flex gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search users by name or email..."
                  className="pl-10"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <Button variant="outline">Filter</Button>
            </div>
          </CardContent>
        </AnimatedCard>

        {/* Users Table */}
        <AnimatedCard delay={0.2}>
          <CardHeader>
            <CardTitle>Team Members</CardTitle>
            <CardDescription>{filteredUsers.length} users in your workspace</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Join Date</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-xs font-bold">
                          {user.avatar}
                        </div>
                        <div>
                          <p className="font-medium text-foreground">{user.name}</p>
                          <p className="text-sm text-muted-foreground">{user.email}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{user.role}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={user.status === "active" ? "default" : "secondary"}>{user.status}</Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground">{user.joinDate}</TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="icon">
                        <MoreHorizontal className="w-4 h-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </AnimatedCard>
      </div>
    </AppLayout>
  )
}
