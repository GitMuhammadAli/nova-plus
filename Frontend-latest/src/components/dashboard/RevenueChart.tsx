import { Card } from "@/components/ui/card";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

const data = [
  { month: "Jan", revenue: 4500, target: 4000 },
  { month: "Feb", revenue: 5200, target: 5000 },
  { month: "Mar", revenue: 4800, target: 5500 },
  { month: "Apr", revenue: 6100, target: 6000 },
  { month: "May", revenue: 7300, target: 6500 },
  { month: "Jun", revenue: 8200, target: 7500 },
  { month: "Jul", revenue: 7800, target: 8000 },
  { month: "Aug", revenue: 9100, target: 8500 },
  { month: "Sep", revenue: 8900, target: 9000 },
  { month: "Oct", revenue: 10200, target: 9500 },
  { month: "Nov", revenue: 11500, target: 10500 },
  { month: "Dec", revenue: 12800, target: 12000 },
];

export function RevenueChart() {
  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold">Revenue Trend</h3>
          <p className="text-sm text-muted-foreground mt-1">
            Monthly revenue vs target
          </p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-primary" />
            <span className="text-xs text-muted-foreground">Actual</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-info" />
            <span className="text-xs text-muted-foreground">Target</span>
          </div>
        </div>
      </div>

      <ResponsiveContainer width="100%" height={300}>
        <AreaChart data={data}>
          <defs>
            <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
              <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="colorTarget" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="hsl(var(--info))" stopOpacity={0.3} />
              <stop offset="95%" stopColor="hsl(var(--info))" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
          <XAxis
            dataKey="month"
            stroke="hsl(var(--muted-foreground))"
            fontSize={12}
          />
          <YAxis
            stroke="hsl(var(--muted-foreground))"
            fontSize={12}
            tickFormatter={(value) => `$${value / 1000}k`}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: "hsl(var(--background))",
              border: "1px solid hsl(var(--border))",
              borderRadius: "8px",
            }}
          />
          <Area
            type="monotone"
            dataKey="revenue"
            stroke="hsl(var(--primary))"
            strokeWidth={2}
            fillOpacity={1}
            fill="url(#colorRevenue)"
          />
          <Area
            type="monotone"
            dataKey="target"
            stroke="hsl(var(--info))"
            strokeWidth={2}
            strokeDasharray="5 5"
            fillOpacity={1}
            fill="url(#colorTarget)"
          />
        </AreaChart>
      </ResponsiveContainer>
    </Card>
  );
}
