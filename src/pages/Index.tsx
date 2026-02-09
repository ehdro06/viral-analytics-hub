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
import { useMockData } from "@/hooks/use-mock-data";

export default function DashboardPage() {
  const { analytics, realtimeClicks } = useMockData();

  return (
    <DashboardLayout>
      <div className="p-4 lg:p-8 max-w-7xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground tracking-tight">Dashboard</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Real-time analytics across all your links
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 lg:gap-4">
          <div className="col-span-2 lg:col-span-1">
            <RealTimeTicker clicksPerSecond={realtimeClicks} />
          </div>
          <StatsCard
            label="Total Clicks"
            value={analytics.totalClicks}
            icon={MousePointerClick}
            trend={{ value: 12.4, positive: true }}
            variant="primary"
            delay={0.05}
          />
          <StatsCard
            label="Today"
            value={analytics.clicksToday}
            icon={TrendingUp}
            trend={{ value: 8.2, positive: true }}
            delay={0.1}
          />
          <StatsCard
            label="Unique Visitors"
            value={analytics.uniqueVisitors}
            icon={Users}
            trend={{ value: 5.7, positive: true }}
            delay={0.15}
          />
          <StatsCard
            label="Peak /min"
            value={analytics.peakClicksPerMinute}
            icon={Flame}
            variant="viral"
            delay={0.2}
          />
        </div>

        {/* Charts */}
        <TimeSeriesChart data={analytics.timeSeries} />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <ReferrerBreakdown data={analytics.referrers} />
          <GeoBreakdown data={analytics.geoData} />
        </div>
      </div>
    </DashboardLayout>
  );
}
