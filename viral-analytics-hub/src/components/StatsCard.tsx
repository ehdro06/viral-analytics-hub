import { motion } from "framer-motion";
import { LucideIcon } from "lucide-react";

interface StatsCardProps {
  label: string;
  value: string | number;
  icon: LucideIcon;
  trend?: { value: number; positive: boolean };
  variant?: "default" | "viral" | "primary";
  delay?: number;
}

export default function StatsCard({
  label,
  value,
  icon: Icon,
  trend,
  variant = "default",
  delay = 0,
}: StatsCardProps) {
  const variantStyles = {
    default: "bg-card border-border",
    primary: "bg-card border-primary/20 glow-primary",
    viral: "bg-card border-viral/20 glow-viral",
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.4, ease: "easeOut" }}
      className={`rounded-xl border p-5 ${variantStyles[variant]}`}
    >
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
          {label}
        </span>
        <div
          className={`w-8 h-8 rounded-lg flex items-center justify-center ${
            variant === "viral"
              ? "bg-viral/10 text-viral"
              : "bg-primary/10 text-primary"
          }`}
        >
          <Icon className="w-4 h-4" />
        </div>
      </div>
      <div className="flex items-end gap-2">
        <span
          className={`text-2xl font-bold tracking-tight font-mono ${
            variant === "viral" ? "text-gradient-viral" : ""
          }`}
        >
          {typeof value === "number" ? value.toLocaleString() : value}
        </span>
        {trend && (
          <span
            className={`text-xs font-medium mb-1 ${
              trend.positive ? "text-success" : "text-destructive"
            }`}
          >
            {trend.positive ? "+" : ""}
            {trend.value}%
          </span>
        )}
      </div>
    </motion.div>
  );
}
