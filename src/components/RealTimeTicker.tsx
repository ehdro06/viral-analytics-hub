import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Zap } from "lucide-react";

interface RealTimeTickerProps {
  clicksPerSecond: number;
}

export default function RealTimeTicker({ clicksPerSecond }: RealTimeTickerProps) {
  const [displayed, setDisplayed] = useState(clicksPerSecond);
  const isViral = clicksPerSecond > 15;

  useEffect(() => {
    setDisplayed(clicksPerSecond);
  }, [clicksPerSecond]);

  return (
    <div
      className={`rounded-xl border p-5 transition-all duration-500 ${
        isViral
          ? "bg-card border-viral/30 glow-viral"
          : "bg-card border-border"
      }`}
    >
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
          Live Clicks / sec
        </span>
        <div className="flex items-center gap-1.5">
          <div
            className={`w-2 h-2 rounded-full ${
              isViral ? "bg-viral animate-pulse-glow" : "bg-success animate-pulse"
            }`}
          />
          <span className="text-xs text-muted-foreground">LIVE</span>
        </div>
      </div>
      <div className="flex items-center gap-3">
        <AnimatePresence mode="popLayout">
          <motion.span
            key={displayed}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className={`text-4xl font-bold font-mono tracking-tighter ${
              isViral ? "text-gradient-viral" : "text-foreground"
            }`}
          >
            {displayed}
          </motion.span>
        </AnimatePresence>
        {isViral && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="flex items-center gap-1 px-2 py-1 rounded-full bg-viral/15 text-viral"
          >
            <Zap className="w-3 h-3" />
            <span className="text-xs font-bold">VIRAL</span>
          </motion.div>
        )}
      </div>
    </div>
  );
}
