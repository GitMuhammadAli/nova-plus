// Dashboard Types

export interface DashboardSummary {
  revenue: {
    total: number;
    growth: number;
    period: string;
  };
  users: {
    total: number;
    active: number;
    growth: number;
    period: string;
  };
  activity: {
    total: number;
    growth: number;
    period: string;
  };
  growth: {
    percentage: number;
    period: string;
  };
}

export interface StatPoint {
  date: string;
  value: number;
  label?: string;
}

export interface DashboardStats {
  userGrowth: StatPoint[];
  activityTrend: StatPoint[];
  revenueTrend?: StatPoint[];
  taskCompletion?: StatPoint[];
}

export interface RecentActivity {
  id: string;
  type: string;
  user?: {
    id: string;
    name: string;
    email: string;
  };
  action: string;
  description?: string;
  target?: string;
  timestamp: string;
  icon?: string;
}

