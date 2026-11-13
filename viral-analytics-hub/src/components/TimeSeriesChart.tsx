import { useMemo } from "react";
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis, type TooltipProps } from "recharts";
import { TimeSeriesPoint } from "@/lib/types";
import { EmptyChart } from "@/components/DataState";

interface TimeSeriesChartProps {
  data: TimeSeriesPoint[];
  /** Pixel height of the plot area. */
  height?: number;
}

const LOCALE = "en-US"; // UI is English-only; times are in the viewer's own time zone
const hourTick = (ms: number) => new Date(ms).toLocaleTimeString(LOCALE, { hour: "numeric" });
const hourRange = (ms: number) => {
  const from = new Date(ms);
  const to = new Date(ms + 3_600_000);
  const day = from.toLocaleDateString(LOCALE, { weekday: "short", month: "short", day: "numeric" });
  const t = (d: Date) => d.toLocaleTimeString(LOCALE, { hour: "numeric", minute: "2-digit" });
  return `${day}, ${t(from)}–${t(to)}`;
};

function ChartTooltip({ active, payload }: TooltipProps<number, string>) {
  if (!active || !payload?.length) return null;
  const point = payload[0].payload as { t: number; clicks: number };
  return (
    <div className="rounded-md bg-surface px-3 py-2 text-meta shadow-md dark:border dark:shadow-none">
      <p className="text-muted-foreground">{hourRange(point.t)}</p>
      <p className="mt-0.5 font-medium tabular-nums text-foreground">
        {point.clicks.toLocaleString(LOCALE)} {point.clicks === 1 ? "click" : "clicks"}
      </p>
    </div>
  );
}

/**
 * Hourly clicks, one series. Colours come from CSS tokens (see .chart rules in globals.css), so light and dark both
 * work. No animation: the data refreshes every 10 seconds and redrawing would only distract.
 */
export default function TimeSeriesChart({ data, height = 240 }: TimeSeriesChartProps) {
  const points = useMemo(() => data.map((d) => ({ t: new Date(d.timestamp).getTime(), clicks: d.clicks })), [data]);

  if (data.every((d) => d.clicks === 0)) return <EmptyChart />;

  return (
    <div className="chart text-primary" style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={points} margin={{ top: 8, right: 4, left: 0, bottom: 0 }}>
          <CartesianGrid vertical={false} />
          <XAxis
            dataKey="t"
            type="number"
            scale="time"
            domain={["dataMin", "dataMax"]}
            tickFormatter={hourTick}
            tickLine={false}
            axisLine={false}
            minTickGap={32}
            tickMargin={8}
          />
          <YAxis tickLine={false} axisLine={false} width={40} allowDecimals={false} tickMargin={4} />
          <Tooltip content={<ChartTooltip />} cursor={{ stroke: "currentColor", strokeOpacity: 0.3 }} isAnimationActive={false} />
          <Area
            type="monotone"
            dataKey="clicks"
            stroke="currentColor"
            strokeWidth={2}
            fill="currentColor"
            fillOpacity={0.08}
            isAnimationActive={false}
            activeDot={{ r: 4, strokeWidth: 0, fill: "currentColor" }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
