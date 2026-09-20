import { useMemo } from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { TimeSeriesPoint } from "@/lib/types";
import { EmptyChart } from "@/components/DataState";

interface TimeSeriesChartProps {
  data: TimeSeriesPoint[];
}

export default function TimeSeriesChart({ data }: TimeSeriesChartProps) {
  const formatted = useMemo(
    () =>
      data.map((d) => ({
        ...d,
        label: new Date(d.timestamp).toLocaleString([], {
          month: "short",
          day: "numeric",
          hour: "numeric",
        }),
      })),
    [data]
  );

  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-foreground">Clicks Over Time</h3>
        <span className="text-xs text-muted-foreground">Last 48 hours</span>
      </div>
      {data.every((d) => d.clicks === 0) ? (
        <EmptyChart />
      ) : (
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={formatted} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="clickGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="hsl(174, 72%, 52%)" stopOpacity={0.3} />
                <stop offset="100%" stopColor="hsl(174, 72%, 52%)" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(222, 20%, 16%)" />
            <XAxis
              dataKey="label"
              tick={{ fill: "hsl(215, 20%, 55%)", fontSize: 11 }}
              tickLine={false}
              axisLine={false}
              interval="preserveStartEnd"
            />
            <YAxis
              tick={{ fill: "hsl(215, 20%, 55%)", fontSize: 11 }}
              tickLine={false}
              axisLine={false}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "hsl(222, 44%, 10%)",
                border: "1px solid hsl(222, 20%, 16%)",
                borderRadius: "8px",
                color: "hsl(210, 40%, 96%)",
                fontSize: 12,
              }}
            />
            <Area
              type="monotone"
              dataKey="clicks"
              stroke="hsl(174, 72%, 52%)"
              strokeWidth={2}
              fill="url(#clickGradient)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
      )}
    </div>
  );
}
