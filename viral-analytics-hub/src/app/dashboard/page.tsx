"use client";

import DashboardLayout from "@/components/DashboardLayout";
import PageHeader from "@/components/PageHeader";
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
      <div className="mx-auto max-w-6xl space-y-8 px-4 py-6 lg:px-8 lg:py-8">
        <PageHeader title="Dashboard" description="Clicks across all your links, updated every 10 seconds." />

        {isError && (
          <ErrorState
            message={error instanceof Error ? error.message : "The analytics service is unreachable."}
            onRetry={() => refetch()}
          />
        )}

        {isPending && !isError && <AnalyticsSkeleton />}

        {data && (
          <>
            {/* Lead: what is happening right now, and the last two days */}
            <section
              aria-label="Live clicks"
              className="grid gap-6 rounded-lg border bg-surface p-5 lg:grid-cols-[minmax(200px,240px)_1fr] lg:gap-8"
            >
              <RealTimeTicker clicksLastMinute={data.clicksLastMinute} peakClicksPerMinute={data.peakClicksPerMinute} />
              <div className="min-w-0">
                <h2 className="text-sm text-muted-foreground">Clicks per hour, last 48 hours</h2>
                <div className="mt-3">
                  <TimeSeriesChart data={data.timeSeries} height={220} />
                </div>
              </div>
            </section>

            <dl className="grid grid-cols-2 gap-x-6 gap-y-5 border-y py-5 lg:grid-cols-4">
              <StatsCard label="Total clicks" value={data.totalClicks} />
              <StatsCard label="Last 24 hours" value={data.clicksLast24h} />
              <StatsCard label="Unique visitors, 7 days" value={data.uniqueVisitors} />
              <StatsCard label="Average per day, 30 days" value={data.avgClicksPerDay} />
            </dl>

            <div className="grid grid-cols-1 gap-10 lg:grid-cols-2">
              <ReferrerBreakdown data={data.referrers} limit={5} moreHref="/analytics" />
              <GeoBreakdown data={data.geoData} limit={5} moreHref="/analytics" />
            </div>
          </>
        )}
      </div>
    </DashboardLayout>
  );
}
