import { motion } from "framer-motion";
import { AppShell } from "@/components/layout/AppShell";
import { Card } from "@/components/ui/card";
import { TrendingUp, Users, DollarSign, Activity } from "lucide-react";
import { ActivityFeed } from "@/components/dashboard/ActivityFeed";
import { QuickActions } from "@/components/dashboard/QuickActions";
import { RevenueChart } from "@/components/dashboard/RevenueChart";
import { UserActivityChart } from "@/components/dashboard/UserActivityChart";

export default function Dashboard() {
  const kpiCards = [
    {
      title: "Total Revenue",
      value: "$45,231",
      change: "+20.1%",
      icon: DollarSign,
      trend: "up",
    },
    {
      title: "Active Users",
      value: "2,345",
      change: "+12.5%",
      icon: Users,
      trend: "up",
    },
    {
      title: "Conversion Rate",
      value: "3.24%",
      change: "+4.2%",
      icon: TrendingUp,
      trend: "up",
    },
    {
      title: "System Health",
      value: "99.9%",
      change: "Optimal",
      icon: Activity,
      trend: "stable",
    },
  ];

  return (
    <AppShell>
      <div className="p-8 space-y-8">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
          <p className="text-muted-foreground mt-1">
            Welcome back! Here's what's happening with your workspace.
          </p>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {kpiCards.map((kpi, index) => (
            <motion.div
              key={kpi.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: index * 0.1 }}
            >
              <Card className="p-6 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">{kpi.title}</p>
                    <p className="text-2xl font-bold text-foreground">{kpi.value}</p>
                    <p
                      className={`text-sm mt-2 ${
                        kpi.trend === "up"
                          ? "text-success"
                          : kpi.trend === "down"
                          ? "text-danger"
                          : "text-muted-foreground"
                      }`}
                    >
                      {kpi.change}
                    </p>
                  </div>
                  <div className="w-12 h-12 rounded-lg bg-primary-subtle flex items-center justify-center">
                    <kpi.icon className="w-6 h-6 text-primary" />
                  </div>
                </div>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.5 }}
          >
            <RevenueChart />
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.6 }}
          >
            <UserActivityChart />
          </motion.div>
        </div>

        {/* Quick Actions & Activity Feed */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.7 }}
            className="lg:col-span-1"
          >
            <QuickActions />
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.8 }}
            className="lg:col-span-2"
          >
            <ActivityFeed />
          </motion.div>
        </div>
      </div>
    </AppShell>
  );
}
