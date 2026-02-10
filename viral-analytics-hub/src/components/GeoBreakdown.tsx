import { GeoDataPoint } from "@/hooks/use-mock-data";
import { motion } from "framer-motion";
import { Globe } from "lucide-react";

interface GeoBreakdownProps {
  data: GeoDataPoint[];
}

export default function GeoBreakdown({ data }: GeoBreakdownProps) {
  const total = data.reduce((sum, d) => sum + d.count, 0);
  const max = data[0]?.count || 1;

  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <div className="flex items-center gap-2 mb-4">
        <Globe className="w-4 h-4 text-primary" />
        <h3 className="text-sm font-semibold text-foreground">Geographic Distribution</h3>
      </div>
      <div className="space-y-2.5">
        {data.map((item, i) => {
          const pct = ((item.count / total) * 100).toFixed(1);
          return (
            <motion.div
              key={item.countryCode}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: i * 0.04 }}
              className="flex items-center gap-3"
            >
              <span className="w-7 text-center text-xs font-mono text-muted-foreground">
                {item.countryCode}
              </span>
              <div className="flex-1">
                <div className="h-2 rounded-full bg-secondary overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${(item.count / max) * 100}%` }}
                    transition={{ delay: i * 0.04 + 0.3, duration: 0.5 }}
                    className="h-full rounded-full"
                    style={{
                      background: `linear-gradient(90deg, hsl(174, 72%, 52%), hsl(200, 72%, 55%))`,
                    }}
                  />
                </div>
              </div>
              <span className="text-xs font-mono text-muted-foreground w-16 text-right">
                {item.count.toLocaleString()}
              </span>
              <span className="text-xs text-primary font-medium w-10 text-right">
                {pct}%
              </span>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
