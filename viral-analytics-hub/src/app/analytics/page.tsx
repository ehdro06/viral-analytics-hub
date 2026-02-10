"use client";

import DashboardLayout from "@/components/DashboardLayout";
import TimeSeriesChart from "@/components/TimeSeriesChart";
import ReferrerBreakdown from "@/components/ReferrerBreakdown";
import GeoBreakdown from "@/components/GeoBreakdown";
import { useMockData } from "@/hooks/use-mock-data";

export default function AnalyticsPage() {
  const { analytics } = useMockData();

  return (
    <DashboardLayout>
      <div className="p-4 lg:p-8 max-w-7xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground tracking-tight">Analytics</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Deep dive into your link performance
          </p>
        </div>
        <TimeSeriesChart data={analytics.timeSeries} />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <ReferrerBreakdown data={analytics.referrers} />
          <GeoBreakdown data={analytics.geoData} />
        </div>
      </div>
    </DashboardLayout>
  );
}
