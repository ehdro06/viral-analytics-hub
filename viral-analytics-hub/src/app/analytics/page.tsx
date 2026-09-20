"use client";

import DashboardLayout from "@/components/DashboardLayout";
import TimeSeriesChart from "@/components/TimeSeriesChart";
import ReferrerBreakdown from "@/components/ReferrerBreakdown";
import GeoBreakdown from "@/components/GeoBreakdown";
import { AnalyticsSkeleton, ErrorState } from "@/components/DataState";
import { useAnalytics } from "@/hooks/use-analytics";

export default function AnalyticsPage() {
  const { data, isPending, isError, error, refetch } = useAnalytics();

  return (
    <DashboardLayout>
      <div className="p-4 lg:p-8 max-w-7xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground tracking-tight">Analytics</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Deep dive into your link performance
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
