import { useQuery } from "@tanstack/react-query";
import { useAuthStore } from "./use-auth-store";
import type { AnalyticsData, GeoDataPoint, ReferrerData, TimeSeriesPoint } from "@/types/virallink";

const EMPTY: AnalyticsData = {
  totalClicks: 0,
  clicksToday: 0,
  clicksThisWeek: 0,
  uniqueVisitors: 0,
  avgClicksPerDay: 0,
  peakClicksPerMinute: 0,
  geoData: [],
  timeSeries: [],
  referrers: [],
};

export function useAnalyticsSummary() {
  const { token } = useAuthStore();

  return useQuery({
    queryKey: ["analytics-summary"],
    enabled: !!token,
    retry: 1,
    refetchInterval: 10_000,
    refetchIntervalInBackground: false,
    refetchOnWindowFocus: true,
    queryFn: async (): Promise<AnalyticsData> => {
      const res = await fetch("/api/v1/analytics/summary", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        throw new Error("Failed to fetch analytics summary");
      }
      const raw = await res.json();
      return mapApiSummary(raw);
    },
  });
}

export function mapApiSummary(raw: Record<string, unknown>): AnalyticsData {
  if (!raw || typeof raw !== "object") {
    return { ...EMPTY };
  }

  const geoRaw = raw.geoData;
  const geoData: GeoDataPoint[] = Array.isArray(geoRaw)
    ? geoRaw.map((g: Record<string, unknown>) => ({
        country: String(g.country ?? ""),
        countryCode: String(g.countryCode ?? ""),
        count: Number(g.count ?? 0),
      }))
    : [];

  const tsRaw = raw.timeSeries;
  const timeSeries: TimeSeriesPoint[] = Array.isArray(tsRaw)
    ? tsRaw.map((t: Record<string, unknown>) => ({
        timestamp: normalizeTimestamp(t.timestamp),
        clicks: Number(t.clicks ?? 0),
      }))
    : [];

  const refRaw = raw.referrers;
  const referrers: ReferrerData[] = Array.isArray(refRaw)
    ? refRaw.map((r: Record<string, unknown>) => ({
        source: String(r.source ?? ""),
        clicks: Number(r.clicks ?? 0),
        percentage: Number(r.percentage ?? 0),
      }))
    : [];

  return {
    totalClicks: Number(raw.totalClicks ?? 0),
    clicksToday: Number(raw.clicksToday ?? 0),
    clicksThisWeek: Number(raw.clicksThisWeek ?? 0),
    uniqueVisitors: Number(raw.uniqueVisitors ?? 0),
    avgClicksPerDay: Number(raw.avgClicksPerDay ?? 0),
    peakClicksPerMinute: Number(raw.peakClicksPerMinute ?? 0),
    geoData,
    timeSeries,
    referrers,
  };
}

/**
 * Spring may serialize LocalDateTime as ISO string or (older) nested array.
 */
function normalizeTimestamp(value: unknown): string {
  if (value == null) {
    return new Date().toISOString();
  }
  if (typeof value === "string") {
    return value;
  }
  if (Array.isArray(value) && value.length >= 3) {
    const y = Number(value[0]);
    const m = Number(value[1]);
    const d = Number(value[2]);
    const h = value.length > 3 ? Number(value[3]) : 0;
    const min = value.length > 4 ? Number(value[4]) : 0;
    const sec = value.length > 5 ? Number(value[5]) : 0;
    return new Date(y, m - 1, d, h, min, sec).toISOString();
  }
  return new Date().toISOString();
}
