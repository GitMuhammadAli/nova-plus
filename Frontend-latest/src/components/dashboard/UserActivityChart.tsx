import { Card } from "@/components/ui/card";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

const data = [
  { day: "Mon", active: 1240, new: 85 },
  { day: "Tue", active: 1380, new: 102 },
  { day: "Wed", active: 1520, new: 95 },
  { day: "Thu", active: 1650, new: 118 },
  { day: "Fri", active: 1890, new: 145 },
  { day: "Sat", active: 980, new: 68 },
  { day: "Sun", active: 1120, new: 72 },
];

export function UserActivityChart() {
  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold">User Activity</h3>
          <p className="text-sm text-muted-foreground mt-1">
            Active vs new users this week
          </p>
        </div>
      </div>

      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
          <XAxis
            dataKey="day"
            stroke="hsl(var(--muted-foreground))"
            fontSize={12}
          />
          <YAxis
            stroke="hsl(var(--muted-foreground))"
            fontSize={12}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: "hsl(var(--background))",
              border: "1px solid hsl(var(--border))",
              borderRadius: "8px",
            }}
          />
          <Legend
            wrapperStyle={{
              fontSize: "12px",
            }}
          />
          <Bar
            dataKey="active"
            fill="hsl(var(--primary))"
            radius={[4, 4, 0, 0]}
            name="Active Users"
          />
          <Bar
            dataKey="new"
            fill="hsl(var(--success))"
            radius={[4, 4, 0, 0]}
            name="New Users"
          />
        </BarChart>
      </ResponsiveContainer>
    </Card>
  );
}
