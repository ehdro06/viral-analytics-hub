import { ReferrerData } from "@/hooks/use-mock-data";
import { motion } from "framer-motion";

interface ReferrerBreakdownProps {
  data: ReferrerData[];
}

export default function ReferrerBreakdown({ data }: ReferrerBreakdownProps) {
  const max = Math.max(...data.map((d) => d.clicks));

  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <h3 className="text-sm font-semibold text-foreground mb-4">Top Referrers</h3>
      <div className="space-y-3">
        {data.map((item, i) => (
          <motion.div
            key={item.source}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.05 }}
          >
            <div className="flex items-center justify-between mb-1">
              <span className="text-sm text-foreground">{item.source}</span>
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono text-muted-foreground">
                  {item.clicks.toLocaleString()}
                </span>
                <span className="text-xs text-primary font-medium w-12 text-right">
                  {item.percentage}%
                </span>
              </div>
            </div>
            <div className="h-1.5 rounded-full bg-secondary overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${(item.clicks / max) * 100}%` }}
                transition={{ delay: i * 0.05 + 0.2, duration: 0.6, ease: "easeOut" }}
                className="h-full rounded-full bg-gradient-to-r from-primary to-chart-5"
              />
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
