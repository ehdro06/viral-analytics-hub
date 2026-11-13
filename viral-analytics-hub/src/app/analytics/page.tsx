"use client";

import DashboardLayout from "@/components/DashboardLayout";
import PageHeader from "@/components/PageHeader";
import TimeSeriesChart from "@/components/TimeSeriesChart";
import ReferrerBreakdown from "@/components/ReferrerBreakdown";
import GeoBreakdown from "@/components/GeoBreakdown";
import { AnalyticsSkeleton, ErrorState } from "@/components/DataState";
import { useAnalytics } from "@/hooks/use-analytics";

export default function AnalyticsPage() {
  const { data, isPending, isError, error, refetch } = useAnalytics();

  return (
    <DashboardLayout>
      <div className="mx-auto max-w-6xl space-y-8 px-4 py-6 lg:px-8 lg:py-8">
        <PageHeader title="Analytics" description="Where your clicks come from, across all links." />

        {isError && (
          <ErrorState
            message={error instanceof Error ? error.message : "The analytics service is unreachable."}
            onRetry={() => refetch()}
          />
        )}

        {isPending && !isError && <AnalyticsSkeleton />}

        {data && (
          <>
            <section aria-labelledby="hourly-title" className="rounded-lg border bg-surface p-5">
              <div className="flex items-baseline justify-between gap-4">
                <h2 id="hourly-title" className="text-section-title text-foreground">
                  Clicks per hour
                </h2>
                <p className="text-meta text-muted-foreground">Last 48 hours, your time zone</p>
              </div>
              <div className="mt-4">
                <TimeSeriesChart data={data.timeSeries} height={300} />
              </div>
            </section>

            <div className="grid grid-cols-1 gap-10 lg:grid-cols-2">
              <ReferrerBreakdown data={data.referrers} />
              <GeoBreakdown data={data.geoData} />
            </div>
          </>
        )}
      </div>
    </DashboardLayout>
  );
}
