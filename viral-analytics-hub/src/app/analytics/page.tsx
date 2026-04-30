"use client";

import DashboardLayout from "@/components/DashboardLayout";
import TimeSeriesChart from "@/components/TimeSeriesChart";
import ReferrerBreakdown from "@/components/ReferrerBreakdown";
import GeoBreakdown from "@/components/GeoBreakdown";
import { useMockData, AnalyticsData } from "@/hooks/use-mock-data";
import { useAuthStore } from "@/hooks/use-auth-store";
import { useQuery } from "@tanstack/react-query";

export default function AnalyticsPage() {
  const { analytics } = useMockData();
  const { token } = useAuthStore();

  const { data: liveAnalytics } = useQuery<AnalyticsData>({
    queryKey: ["analytics-summary"],
    enabled: !!token,
    retry: 1,
    refetchInterval: 10_000,
    refetchIntervalInBackground: false,
    queryFn: async () => {
      const res = await fetch("/api/v1/analytics/summary", {
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      });
      if (!res.ok) {
        throw new Error("Failed to fetch analytics summary");
      }
      const api = await res.json();
      return mapApiToAnalytics(api, analytics);
    },
  });

  const data: AnalyticsData = liveAnalytics ?? analytics;

  return (
    <DashboardLayout>
      <div className="p-4 lg:p-8 max-w-7xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground tracking-tight">Analytics</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Deep dive into your link performance
          </p>
        </div>
        <TimeSeriesChart data={data.timeSeries} />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <ReferrerBreakdown data={data.referrers} />
          <GeoBreakdown data={data.geoData} />
        </div>
      </div>
    </DashboardLayout>
  );
}

function mapApiToAnalytics(api: any, fallback: AnalyticsData): AnalyticsData {
  return {
    totalClicks: api?.totalClicks ?? fallback.totalClicks ?? 0,
    clicksToday: api?.clicksToday ?? fallback.clicksToday ?? 0,
    clicksThisWeek: api?.clicksThisWeek ?? fallback.clicksThisWeek ?? 0,
    uniqueVisitors: api?.uniqueVisitors ?? fallback.uniqueVisitors ?? 0,
    avgClicksPerDay: api?.avgClicksPerDay ?? fallback.avgClicksPerDay ?? 0,
    peakClicksPerMinute: api?.peakClicksPerMinute ?? fallback.peakClicksPerMinute ?? 0,
    geoData: api?.geoData ?? fallback.geoData ?? [],
    timeSeries: api?.timeSeries ?? fallback.timeSeries ?? [],
    referrers: api?.referrers ?? fallback.referrers ?? [],
  };
}
