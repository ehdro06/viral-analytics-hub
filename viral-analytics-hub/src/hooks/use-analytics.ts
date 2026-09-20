import { useQuery } from "@tanstack/react-query";
import { useAuthStore } from "./use-auth-store";
import { AnalyticsData } from "@/lib/types";

const POLL_INTERVAL_MS = 5000;

/** Live analytics for the signed-in user's links. Polls the analytics service every few seconds. */
export function useAnalytics() {
  const { token } = useAuthStore();

  return useQuery<AnalyticsData>({
    queryKey: ["analytics-summary"],
    enabled: !!token,
    refetchInterval: POLL_INTERVAL_MS,
    refetchIntervalInBackground: false,
    retry: 1,
    queryFn: async () => {
      const res = await fetch("/api/v1/analytics/summary", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error(`Analytics request failed (${res.status})`);
      return res.json();
    },
  });
}
