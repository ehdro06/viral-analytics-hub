// Shapes returned by the backend services. Keep in sync with:
//   redirect  -> Link (LinkItem is the mapped form, see hooks/use-links.ts)
//   analytics -> AnalyticsSummaryResponse

export interface LinkItem {
  id: string;
  shortCode: string;
  originalUrl: string;
  totalClicks: number;
  createdAt: string;
  /** True for the optimistic placeholder shown while the create request is in flight. */
  pending?: boolean;
}

export interface GeoDataPoint {
  country: string;
  countryCode: string;
  count: number;
}

export interface TimeSeriesPoint {
  /** ISO-8601 instant (UTC). */
  timestamp: string;
  clicks: number;
}

export interface ReferrerData {
  source: string;
  clicks: number;
  percentage: number;
}

export interface AnalyticsData {
  totalClicks: number;
  clicksLastMinute: number;
  clicksLast24h: number;
  clicksLast7Days: number;
  uniqueVisitors: number;
  avgClicksPerDay: number;
  peakClicksPerMinute: number;
  geoData: GeoDataPoint[];
  timeSeries: TimeSeriesPoint[];
  referrers: ReferrerData[];
}
