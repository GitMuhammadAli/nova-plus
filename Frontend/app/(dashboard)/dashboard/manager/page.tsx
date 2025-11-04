"use client"

import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '@/app/store/store';
import { motion } from 'framer-motion';
import { Users, UserPlus, FolderKanban, FileText, TrendingUp } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { RoleGuard } from '@/components/guards/RoleGuard';
import { usersAPI } from '@/app/services';
import { useRouter } from 'next/navigation';

const ManagerDashboard = () => {
  const router = useRouter();
  const { user } = useSelector((state: RootState) => state.auth);
  const [stats, setStats] = useState({
    teamSize: 0,
    activeProjects: 0,
    pendingTasks: 0,
    completedTasks: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await usersAPI.getMyUsers({ limit: 1000 });
        const teamUsers = response.data?.data || [];
        
        setStats({
          teamSize: teamUsers.length,
          activeProjects: 0, // Will be populated in Phase 3
          pendingTasks: 0, // Will be populated in Phase 4
          completedTasks: 0, // Will be populated in Phase 4
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
    <RoleGuard allowedRoles={['manager']}>
      <div className="space-y-8 max-w-7xl mx-auto">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-foreground">
            Manager Dashboard 👨‍🏫
          </h1>
          <p className="text-muted-foreground mt-1">
            Manage your team, projects, and tasks.
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
                  <p className="text-sm text-muted-foreground mb-1">Team Size</p>
                  <p className="text-3xl font-bold text-foreground">{stats.teamSize}</p>
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
                  <p className="text-sm text-muted-foreground mb-1">Active Projects</p>
                  <p className="text-3xl font-bold text-foreground">{stats.activeProjects}</p>
                </div>
                <div className="w-12 h-12 rounded-full bg-blue-500/20 flex items-center justify-center">
                  <FolderKanban className="w-6 h-6 text-blue-500" />
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
                  <p className="text-sm text-muted-foreground mb-1">Pending Tasks</p>
                  <p className="text-3xl font-bold text-foreground">{stats.pendingTasks}</p>
                </div>
                <div className="w-12 h-12 rounded-full bg-yellow-500/20 flex items-center justify-center">
                  <FileText className="w-6 h-6 text-yellow-500" />
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
                  <p className="text-sm text-muted-foreground mb-1">Completed Tasks</p>
                  <p className="text-3xl font-bold text-foreground">{stats.completedTasks}</p>
                </div>
                <div className="w-12 h-12 rounded-full bg-green-500/20 flex items-center justify-center">
                  <TrendingUp className="w-6 h-6 text-green-500" />
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
              onClick={() => router.push('/users?create=user')}
              className="w-full h-auto flex flex-col items-center justify-center py-6 gap-2"
            >
              <UserPlus className="w-6 h-6" />
              <span>Add Team Member</span>
            </Button>
            <Button
              onClick={() => router.push('/users')}
              variant="outline"
              className="w-full h-auto flex flex-col items-center justify-center py-6 gap-2"
            >
              <Users className="w-6 h-6" />
              <span>View My Team</span>
            </Button>
            <Button
              onClick={() => router.push('/analytics')}
              variant="outline"
              className="w-full h-auto flex flex-col items-center justify-center py-6 gap-2"
            >
              <FolderKanban className="w-6 h-6" />
              <span>Manage Projects</span>
            </Button>
          </div>
        </Card>

        {/* Info Card */}
        <Card className="p-6 bg-muted/50">
          <h3 className="text-lg font-semibold text-foreground mb-2">Manager Responsibilities</h3>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li>• Create and manage Users under your team</li>
            <li>• Create and manage Projects</li>
            <li>• Assign and track Tasks</li>
            <li>• Monitor team progress and project health</li>
            <li>• Review and approve work</li>
          </ul>
        </Card>
      </div>
    </RoleGuard>
  );
};

export default ManagerDashboard;

