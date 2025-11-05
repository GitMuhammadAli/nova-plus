"use client"

import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { RootState, AppDispatch } from '@/app/store/store';
import { motion } from 'framer-motion';
import { Building2, Users, UserPlus, Shield, TrendingUp, BarChart3, Plus } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { RoleGuard } from '@/components/guards/RoleGuard';
import { companyAPI } from '@/app/services';
import { fetchCompanies } from '@/app/store/companySlice';
import { useRouter } from 'next/navigation';

const SuperAdminDashboard = () => {
  const router = useRouter();
  const dispatch = useDispatch<AppDispatch>();
  const { user } = useSelector((state: RootState) => state.auth);
  const { companies, isLoading } = useSelector((state: RootState) => state.company);
  const [stats, setStats] = useState({
    totalCompanies: 0,
    totalUsers: 0,
    activeCompanies: 0,
    recentCompanies: 0,
  });

  useEffect(() => {
    dispatch(fetchCompanies());
  }, [dispatch]);

  useEffect(() => {
    if (companies && companies.length > 0) {
      const activeCompanies = companies.filter((c: any) => c.isActive !== false);
      const recentCompanies = companies.filter((c: any) => {
        const created = new Date(c.createdAt);
        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);
        return created > weekAgo;
      });

      setStats({
        totalCompanies: companies.length,
        totalUsers: companies.reduce((sum: number, c: any) => sum + (c.users?.length || 0), 0),
        activeCompanies: activeCompanies.length,
        recentCompanies: recentCompanies.length,
      });
    }
  }, [companies]);

  const handleCreateCompany = () => {
    router.push('/companies?create=true');
  };

  return (
    <RoleGuard allowedRoles={['super_admin', 'superadmin']}>
      <div className="space-y-8 max-w-7xl mx-auto">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-foreground">
            Super Admin Dashboard 👑
          </h1>
          <p className="text-muted-foreground mt-1">
            Manage all companies, assign company admins, and monitor system-wide activity.
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
                  <p className="text-sm text-muted-foreground mb-1">Total Companies</p>
                  <p className="text-3xl font-bold text-foreground">{stats.totalCompanies}</p>
                </div>
                <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center">
                  <Building2 className="w-6 h-6 text-primary" />
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
                  <p className="text-sm text-muted-foreground mb-1">Total Users</p>
                  <p className="text-3xl font-bold text-foreground">{stats.totalUsers}</p>
                </div>
                <div className="w-12 h-12 rounded-full bg-blue-500/20 flex items-center justify-center">
                  <Users className="w-6 h-6 text-blue-500" />
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
                  <p className="text-sm text-muted-foreground mb-1">Active Companies</p>
                  <p className="text-3xl font-bold text-foreground">{stats.activeCompanies}</p>
                </div>
                <div className="w-12 h-12 rounded-full bg-green-500/20 flex items-center justify-center">
                  <TrendingUp className="w-6 h-6 text-green-500" />
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
                  <p className="text-3xl font-bold text-foreground">{stats.recentCompanies}</p>
                </div>
                <div className="w-12 h-12 rounded-full bg-purple-500/20 flex items-center justify-center">
                  <UserPlus className="w-6 h-6 text-purple-500" />
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
              onClick={handleCreateCompany}
              className="w-full h-auto flex flex-col items-center justify-center py-6 gap-2"
            >
              <Plus className="w-6 h-6" />
              <span>Create Company</span>
            </Button>
            <Button
              onClick={() => router.push('/companies')}
              variant="outline"
              className="w-full h-auto flex flex-col items-center justify-center py-6 gap-2"
            >
              <Building2 className="w-6 h-6" />
              <span>View All Companies</span>
            </Button>
            <Button
              onClick={() => router.push('/analytics')}
              variant="outline"
              className="w-full h-auto flex flex-col items-center justify-center py-6 gap-2"
            >
              <BarChart3 className="w-6 h-6" />
              <span>System Analytics</span>
            </Button>
          </div>
        </Card>

        {/* Recent Companies */}
        {isLoading ? (
          <Card className="p-6">
            <div className="text-center py-8">
              <p className="text-muted-foreground">Loading companies...</p>
            </div>
          </Card>
        ) : companies && companies.length > 0 ? (
          <Card className="p-6">
            <h2 className="text-xl font-semibold text-foreground mb-4">Recent Companies</h2>
            <div className="space-y-3">
              {companies.slice(0, 5).map((company: any, index: number) => (
                <motion.div
                  key={company._id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.1 }}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors cursor-pointer"
                  onClick={() => router.push(`/companies/${company._id}`)}
                >
                  <div>
                    <p className="font-medium text-foreground">{company.name}</p>
                    {company.domain && (
                      <p className="text-sm text-muted-foreground">{company.domain}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <Shield className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">
                      {company.users?.length || 0} users
                    </span>
                  </div>
                </motion.div>
              ))}
            </div>
          </Card>
        ) : (
          <Card className="p-6">
            <div className="text-center py-8">
              <Building2 className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No companies yet. Create your first company!</p>
              <Button onClick={handleCreateCompany} className="mt-4">
                <Plus className="w-4 h-4 mr-2" />
                Create Company
              </Button>
            </div>
          </Card>
        )}

        {/* Info Card */}
        <Card className="p-6 bg-muted/50">
          <h3 className="text-lg font-semibold text-foreground mb-2">Super Admin Responsibilities</h3>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li>• Create and manage companies</li>
            <li>• Assign company admins to each company</li>
            <li>• Monitor system-wide activity and health</li>
            <li>• View analytics across all companies</li>
            <li>• Manage global settings and configurations</li>
          </ul>
        </Card>
      </div>
    </RoleGuard>
  );
};

export default SuperAdminDashboard;

