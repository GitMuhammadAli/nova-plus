export class StatPoint {
  date: string;
  value: number;
  label?: string;
}

export class DashboardStatsDto {
  userGrowth: StatPoint[];
  activityTrend: StatPoint[];
  revenueTrend?: StatPoint[];
  taskCompletion?: StatPoint[];
}
