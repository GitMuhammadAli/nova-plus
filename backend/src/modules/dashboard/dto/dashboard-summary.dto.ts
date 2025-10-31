export class DashboardSummaryDto {
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

