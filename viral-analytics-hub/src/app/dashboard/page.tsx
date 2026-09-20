"use client";

import {
  MousePointerClick,
  Users,
  TrendingUp,
  Flame,
} from "lucide-react";
import DashboardLayout from "@/components/DashboardLayout";
import StatsCard from "@/components/StatsCard";
import RealTimeTicker from "@/components/RealTimeTicker";
import TimeSeriesChart from "@/components/TimeSeriesChart";
import ReferrerBreakdown from "@/components/ReferrerBreakdown";
import GeoBreakdown from "@/components/GeoBreakdown";
import { AnalyticsSkeleton, ErrorState } from "@/components/DataState";
import { useAnalytics } from "@/hooks/use-analytics";

export default function DashboardPage() {
  const { data, isPending, isError, error, refetch } = useAnalytics();

  return (
    <DashboardLayout>
      <div className="p-4 lg:p-8 max-w-7xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground tracking-tight">Dashboard</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Live analytics across all your links
          </p>
        </div>

        {isError && (
          <ErrorState
            message={error instanceof Error ? error.message : "The analytics service is unreachable."}
            onRetry={() => refetch()}
          />
        )}

        {isPending && !isError && <AnalyticsSkeleton />}

        {data && (
          <>
            {/* Stats Grid */}
            <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 lg:gap-4">
              <div className="col-span-2 lg:col-span-1">
                <RealTimeTicker clicksLastMinute={data.clicksLastMinute} />
              </div>
              <StatsCard
                label="Total Clicks"
                value={data.totalClicks}
                icon={MousePointerClick}
                variant="primary"
                delay={0.05}
              />
              <StatsCard
                label="Last 24h"
                value={data.clicksLast24h}
                icon={TrendingUp}
                delay={0.1}
              />
              <StatsCard
                label="Unique Visitors (7d)"
                value={data.uniqueVisitors}
                icon={Users}
                delay={0.15}
              />
              <StatsCard
                label="Peak / min (24h)"
                value={data.peakClicksPerMinute}
                icon={Flame}
                variant="viral"
                delay={0.2}
              />
            </div>

            {/* Charts */}
            <TimeSeriesChart data={data.timeSeries} />

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <ReferrerBreakdown data={data.referrers} />
              <GeoBreakdown data={data.geoData} />
            </div>
          </>
        )}
      </div>
    </DashboardLayout>
  );
}
