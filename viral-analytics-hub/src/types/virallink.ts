export interface LinkItem {
  id: string;
  shortCode: string;
  originalUrl: string;
  totalClicks: number;
  status: "active" | "paused" | "expired";
  createdAt: string;
  rules: SmartRule[];
}

export interface SmartRule {
  id: string;
  condition: "country" | "device" | "os" | "browser";
  value: string;
  targetUrl: string;
}

export interface GeoDataPoint {
  country: string;
  countryCode: string;
  count: number;
}

export interface TimeSeriesPoint {
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
  clicksToday: number;
  clicksThisWeek: number;
  uniqueVisitors: number;
  avgClicksPerDay: number;
  peakClicksPerMinute: number;
  geoData: GeoDataPoint[];
  timeSeries: TimeSeriesPoint[];
  referrers: ReferrerData[];
}
