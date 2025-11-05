"use client"

import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { RootState, AppDispatch } from '@/app/store/store';
import { motion } from 'framer-motion';
import { Users, UserPlus, Shield, TrendingUp, BarChart3, Settings, Mail, Copy, Trash2, X } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RoleGuard } from '@/components/guards/RoleGuard';
import { usersAPI, companyAPI, inviteAPI } from '@/app/services';
import { useRouter } from 'next/navigation';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';

const CompanyAdminDashboard = () => {
  const router = useRouter();
  const dispatch = useDispatch<AppDispatch>();
  const { user } = useSelector((state: RootState) => state.auth);
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalManagers: 0,
    totalRegularUsers: 0,
    recentUsers: 0,
  });
  const [company, setCompany] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [invites, setInvites] = useState<any[]>([]);
  const [showInviteDialog, setShowInviteDialog] = useState(false);
  const [inviteForm, setInviteForm] = useState({
    email: '',
    role: 'user',
    expiresInDays: 7,
  });
  const [inviteSubmitting, setInviteSubmitting] = useState(false);
  const [inviteError, setInviteError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        if (user?.companyId) {
          // Fetch company details
          const companyRes = await companyAPI.getById(user.companyId);
          setCompany(companyRes.data);

          // Fetch company users
          const usersRes = await companyAPI.getCompanyUsers(user.companyId, { limit: 1000 });
          const users = Array.isArray(usersRes.data) ? usersRes.data : [];

          const managers = users.filter((u: any) => u.role === 'manager');
          const regularUsers = users.filter((u: any) => u.role === 'user');

          setStats({
            totalUsers: users.length,
            totalManagers: managers.length,
            totalRegularUsers: regularUsers.length,
            recentUsers: users.filter((u: any) => {
              const created = new Date(u.createdAt);
              const weekAgo = new Date();
              weekAgo.setDate(weekAgo.getDate() - 7);
              return created > weekAgo;
            }).length,
          });

          // Fetch invites
          try {
            const invitesRes = await inviteAPI.getCompanyInvites(user.companyId);
            setInvites(Array.isArray(invitesRes.data) ? invitesRes.data : []);
          } catch (err) {
            console.error('Failed to fetch invites:', err);
          }
        }
      } catch (error) {
        console.error('Failed to fetch dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user]);

  const handleCreateInvite = async () => {
    if (!user?.companyId) return;

    setInviteSubmitting(true);
    setInviteError(null);

    try {
      const response = await inviteAPI.createInvite(user.companyId, {
        email: inviteForm.email || undefined,
        role: inviteForm.role,
        expiresInDays: inviteForm.expiresInDays,
      });

      // Refresh invites
      const invitesRes = await inviteAPI.getCompanyInvites(user.companyId);
      setInvites(Array.isArray(invitesRes.data) ? invitesRes.data : []);

      // Reset form and close dialog
      setInviteForm({ email: '', role: 'user', expiresInDays: 7 });
      setShowInviteDialog(false);
    } catch (err: any) {
      setInviteError(err.response?.data?.message || 'Failed to create invite');
    } finally {
      setInviteSubmitting(false);
    }
  };

  const handleRevokeInvite = async (inviteId: string) => {
    if (!user?.companyId) return;

    if (!confirm('Are you sure you want to revoke this invite?')) return;

    try {
      await inviteAPI.revokeInvite(inviteId, user.companyId);
      // Refresh invites
      const invitesRes = await inviteAPI.getCompanyInvites(user.companyId);
      setInvites(Array.isArray(invitesRes.data) ? invitesRes.data : []);
    } catch (err) {
      console.error('Failed to revoke invite:', err);
    }
  };

  const copyInviteLink = (link: string) => {
    navigator.clipboard.writeText(link);
    // You could add a toast notification here
  };

  return (
    <RoleGuard allowedRoles={['company_admin', 'admin']}>
      <div className="space-y-8 max-w-7xl mx-auto">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-foreground">
            Company Admin Dashboard 🏢
          </h1>
          <p className="text-muted-foreground mt-1">
            Manage your company: create managers & users, view projects, and monitor company activity.
            {company && (
              <span className="block mt-1 text-sm">
                Company: <strong>{company.name}</strong>
                {company.domain && ` (${company.domain})`}
              </span>
            )}
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <Card className="p-6 hover:shadow-xl transition-shadow">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Total Users</p>
                  <p className="text-3xl font-bold text-foreground">{stats.totalUsers}</p>
                </div>
                <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center">
                  <Users className="w-6 h-6 text-primary" />
                </div>
              </div>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.1 }}
          >
            <Card className="p-6 hover:shadow-xl transition-shadow">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Managers</p>
                  <p className="text-3xl font-bold text-foreground">{stats.totalManagers}</p>
                </div>
                <div className="w-12 h-12 rounded-full bg-blue-500/20 flex items-center justify-center">
                  <Shield className="w-6 h-6 text-blue-500" />
                </div>
              </div>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.2 }}
          >
            <Card className="p-6 hover:shadow-xl transition-shadow">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Regular Users</p>
                  <p className="text-3xl font-bold text-foreground">{stats.totalRegularUsers}</p>
                </div>
                <div className="w-12 h-12 rounded-full bg-green-500/20 flex items-center justify-center">
                  <UserPlus className="w-6 h-6 text-green-500" />
                </div>
              </div>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.3 }}
          >
            <Card className="p-6 hover:shadow-xl transition-shadow">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">New This Week</p>
                  <p className="text-3xl font-bold text-foreground">{stats.recentUsers}</p>
                </div>
                <div className="w-12 h-12 rounded-full bg-purple-500/20 flex items-center justify-center">
                  <TrendingUp className="w-6 h-6 text-purple-500" />
                </div>
              </div>
            </Card>
          </motion.div>
        </div>

        {/* Quick Actions */}
        <Card className="p-6">
          <h2 className="text-xl font-semibold text-foreground mb-4">Quick Actions</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <Button
              onClick={() => router.push('/users?create=manager')}
              className="w-full h-auto flex flex-col items-center justify-center py-6 gap-2"
            >
              <UserPlus className="w-6 h-6" />
              <span>Create Manager</span>
            </Button>
            <Button
              onClick={() => router.push('/users')}
              variant="outline"
              className="w-full h-auto flex flex-col items-center justify-center py-6 gap-2"
            >
              <Users className="w-6 h-6" />
              <span>Manage Users</span>
            </Button>
            <Dialog open={showInviteDialog} onOpenChange={setShowInviteDialog}>
              <DialogTrigger asChild>
                <Button
                  variant="outline"
                  className="w-full h-auto flex flex-col items-center justify-center py-6 gap-2"
                >
                  <Mail className="w-6 h-6" />
                  <span>Create Invite</span>
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create Invite</DialogTitle>
                  <DialogDescription>
                    Invite a manager or user to join your company
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  {inviteError && (
                    <Alert variant="destructive">
                      <AlertDescription>{inviteError}</AlertDescription>
                    </Alert>
                  )}
                  <div className="space-y-2">
                    <Label htmlFor="invite-email">Email (optional)</Label>
                    <Input
                      id="invite-email"
                      type="email"
                      placeholder="user@example.com (leave empty for open invite)"
                      value={inviteForm.email}
                      onChange={(e) => setInviteForm({ ...inviteForm, email: e.target.value })}
                    />
                    <p className="text-xs text-muted-foreground">
                      Leave empty to create an open invite that anyone can use
                    </p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="invite-role">Role</Label>
                    <Select
                      value={inviteForm.role}
                      onValueChange={(value) => setInviteForm({ ...inviteForm, role: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="user">User</SelectItem>
                        <SelectItem value="manager">Manager</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="invite-expires">Expires in (days)</Label>
                    <Input
                      id="invite-expires"
                      type="number"
                      min="1"
                      max="30"
                      value={inviteForm.expiresInDays}
                      onChange={(e) => setInviteForm({ ...inviteForm, expiresInDays: parseInt(e.target.value) || 7 })}
                    />
                  </div>
                  <Button
                    onClick={handleCreateInvite}
                    disabled={inviteSubmitting}
                    className="w-full"
                  >
                    {inviteSubmitting ? 'Creating...' : 'Create Invite'}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
            <Button
              onClick={() => router.push('/analytics')}
              variant="outline"
              className="w-full h-auto flex flex-col items-center justify-center py-6 gap-2"
            >
              <BarChart3 className="w-6 h-6" />
              <span>View Analytics</span>
            </Button>
          </div>
        </Card>

        {/* Invites Section */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-foreground">Active Invites</h2>
            <Button onClick={() => setShowInviteDialog(true)} size="sm">
              <Mail className="w-4 h-4 mr-2" />
              Create Invite
            </Button>
          </div>
          {invites.length === 0 ? (
            <p className="text-muted-foreground text-sm">No active invites</p>
          ) : (
            <div className="space-y-3">
              {invites.filter((inv: any) => !inv.isUsed && inv.isActive).map((invite: any) => (
                <div
                  key={invite._id}
                  className="flex items-center justify-between p-4 border rounded-lg"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">
                        {invite.email || 'Open invite'}
                      </span>
                      <span className="text-xs px-2 py-1 bg-primary/10 text-primary rounded">
                        {invite.role}
                      </span>
                      {new Date(invite.expiresAt) < new Date() && (
                        <span className="text-xs px-2 py-1 bg-destructive/10 text-destructive rounded">
                          Expired
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      Expires: {new Date(invite.expiresAt).toLocaleDateString()}
                    </p>
                    {(invite.inviteLink || invite.token) && (
                      <div className="flex items-center gap-2 mt-2">
                        <Input
                          value={invite.inviteLink || `${typeof window !== 'undefined' ? window.location.origin : ''}/invite/${invite.token}`}
                          readOnly
                          className="text-xs h-8"
                        />
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => copyInviteLink(invite.inviteLink || `${typeof window !== 'undefined' ? window.location.origin : ''}/invite/${invite.token}`)}
                        >
                          <Copy className="w-3 h-3" />
                        </Button>
                      </div>
                    )}
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleRevokeInvite(invite._id)}
                  >
                    <Trash2 className="w-4 h-4 text-destructive" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* Info Card */}
        <Card className="p-6 bg-muted/50">
          <h3 className="text-lg font-semibold text-foreground mb-2">Company Admin Responsibilities</h3>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li>• Create and manage Managers & Users in your company</li>
            <li>• Create invites to invite team members</li>
            <li>• View all users in your company</li>
            <li>• Monitor company-wide projects and tasks</li>
            <li>• View company analytics and reports</li>
            <li>• Manage company settings and configuration</li>
          </ul>
        </Card>
      </div>
    </RoleGuard>
  );
};

export default CompanyAdminDashboard;

