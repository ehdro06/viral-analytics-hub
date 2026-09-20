import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Zap } from "lucide-react";

interface RealTimeTickerProps {
  clicksLastMinute: number;
}

const VIRAL_THRESHOLD = 300; // clicks per minute

export default function RealTimeTicker({ clicksLastMinute }: RealTimeTickerProps) {
  const [displayed, setDisplayed] = useState(clicksLastMinute);
  const isViral = clicksLastMinute > VIRAL_THRESHOLD;

  useEffect(() => {
    setDisplayed(clicksLastMinute);
  }, [clicksLastMinute]);

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
          Last minute
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
            {displayed.toLocaleString()}
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
      <p className="text-xs text-muted-foreground mt-1">clicks in the last 60 seconds</p>
    </div>
  );
}
