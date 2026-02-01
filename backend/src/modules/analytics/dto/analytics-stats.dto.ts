export interface TrafficDataPoint {
  date: string;
  visitors: number;
  pageviews: number;
  sessions: number;
}

export interface DeviceData {
  name: string;
  value: number;
  color: string;
}

export interface ConversionData {
  stage: string;
  count: number;
  rate: number;
}

export interface TopPageData {
  page: string;
  views: number;
  avgTime: string;
}

export interface AnalyticsStatsDto {
  totalVisitors: number;
  avgSessionDuration: string;
  conversionRate: number;
  revenue: number;
  trafficData: TrafficDataPoint[];
  deviceData: DeviceData[];
  conversionData: ConversionData[];
  topPages: TopPageData[];
  period: string;
  growth: {
    visitors: number;
    sessions: number;
    conversion: number;
    revenue: number;
  };
}
