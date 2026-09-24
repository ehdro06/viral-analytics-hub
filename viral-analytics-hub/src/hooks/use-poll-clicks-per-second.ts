import { useEffect, useRef, useState } from "react";

/**
 * Approximate "live" clicks/sec from consecutive poll samples of totalClicks (e.g. every 10s).
 */
export function usePollClicksPerSecond(totalClicks: number | undefined) {
  const [rate, setRate] = useState(0);
  const prevRef = useRef<{ t: number; c: number } | null>(null);

  useEffect(() => {
    if (totalClicks === undefined) {
      return;
    }
    const now = Date.now();
    const p = prevRef.current;
    if (!p) {
      prevRef.current = { t: now, c: totalClicks };
      setRate(0);
      return;
    }
    const dt = (now - p.t) / 1000;
    if (dt > 0) {
      const delta = totalClicks - p.c;
      setRate(Math.max(0, Math.round((delta / dt) * 10) / 10));
    }
    prevRef.current = { t: now, c: totalClicks };
  }, [totalClicks]);

  return rate;
}
