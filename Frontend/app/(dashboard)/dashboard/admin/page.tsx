"use client"

import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '@/app/store/store';
import { motion } from 'framer-motion';
import { Users, UserPlus, Shield, TrendingUp, BarChart3 } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { RoleGuard } from '@/components/guards/RoleGuard';
import { usersAPI } from '@/app/services';
import { useRouter } from 'next/navigation';

const AdminDashboard = () => {
  const router = useRouter();
  const { user } = useSelector((state: RootState) => state.auth);
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalManagers: 0,
    totalRegularUsers: 0,
    recentUsers: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await usersAPI.getAllForAdmin({ limit: 1000 });
        const users = response.data?.data || [];
        
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
      } catch (error) {
        console.error('Failed to fetch stats:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  return (
    <RoleGuard allowedRoles={['admin', 'superadmin']}>
      <div className="space-y-8 max-w-7xl mx-auto">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-foreground">
            Admin Dashboard 👑
          </h1>
          <p className="text-muted-foreground mt-1">
            Manage your organization, users, and system-wide settings.
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

        {/* Info Card */}
        <Card className="p-6 bg-muted/50">
          <h3 className="text-lg font-semibold text-foreground mb-2">Admin Responsibilities</h3>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li>• Create and manage Managers</li>
            <li>• View system-wide analytics and reports</li>
            <li>• Manage billing and global settings</li>
            <li>• Monitor overall system health</li>
            <li>• Deactivate or remove users/managers</li>
          </ul>
        </Card>
      </div>
    </RoleGuard>
  );
};

export default AdminDashboard;

