import { useState, useEffect, useCallback } from "react";

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

const MOCK_LINKS: LinkItem[] = [
  {
    id: "1",
    shortCode: "rDt4kZ",
    originalUrl: "https://myapp.com/launch-campaign-2025",
    totalClicks: 48293,
    status: "active",
    createdAt: "2025-12-01T10:00:00Z",
    rules: [
      { id: "r1", condition: "device", value: "mobile", targetUrl: "https://apps.apple.com/myapp" },
    ],
  },
  {
    id: "2",
    shortCode: "xK9mPq",
    originalUrl: "https://blog.example.com/how-we-scaled-to-1m-users",
    totalClicks: 127841,
    status: "active",
    createdAt: "2025-11-15T08:30:00Z",
    rules: [],
  },
  {
    id: "3",
    shortCode: "vL2nBw",
    originalUrl: "https://docs.example.com/api/v2/getting-started",
    totalClicks: 8420,
    status: "active",
    createdAt: "2026-01-05T14:20:00Z",
    rules: [
      { id: "r2", condition: "country", value: "DE", targetUrl: "https://docs.example.com/de/api/v2" },
    ],
  },
  {
    id: "4",
    shortCode: "aT7jRe",
    originalUrl: "https://promo.example.com/black-friday-2025",
    totalClicks: 342,
    status: "expired",
    createdAt: "2025-11-20T00:00:00Z",
    rules: [],
  },
  {
    id: "5",
    shortCode: "mN3pYs",
    originalUrl: "https://example.com/webinar-signup",
    totalClicks: 15678,
    status: "active",
    createdAt: "2026-01-20T09:15:00Z",
    rules: [],
  },
];

const MOCK_GEO: GeoDataPoint[] = [
  { country: "United States", countryCode: "US", count: 45230 },
  { country: "Germany", countryCode: "DE", count: 22140 },
  { country: "United Kingdom", countryCode: "GB", count: 18490 },
  { country: "France", countryCode: "FR", count: 12870 },
  { country: "Japan", countryCode: "JP", count: 9340 },
  { country: "Brazil", countryCode: "BR", count: 8120 },
  { country: "Canada", countryCode: "CA", count: 7650 },
  { country: "India", countryCode: "IN", count: 6890 },
  { country: "Australia", countryCode: "AU", count: 5430 },
  { country: "Netherlands", countryCode: "NL", count: 4210 },
];

const MOCK_REFERRERS: ReferrerData[] = [
  { source: "Twitter / X", clicks: 52340, percentage: 32.4 },
  { source: "Reddit", clicks: 38920, percentage: 24.1 },
  { source: "Hacker News", clicks: 22150, percentage: 13.7 },
  { source: "Direct", clicks: 19870, percentage: 12.3 },
  { source: "LinkedIn", clicks: 12430, percentage: 7.7 },
  { source: "Discord", clicks: 8940, percentage: 5.5 },
  { source: "Other", clicks: 6924, percentage: 4.3 },
];

function generateTimeSeries(): TimeSeriesPoint[] {
  const points: TimeSeriesPoint[] = [];
  const now = new Date();
  for (let i = 47; i >= 0; i--) {
    const timestamp = new Date(now.getTime() - i * 3600000);
    const hour = timestamp.getHours();
    const baseClicks = hour >= 8 && hour <= 22 ? 800 : 200;
    const viralSpike = i >= 20 && i <= 28 ? 2000 : 0;
    const clicks = Math.floor(baseClicks + viralSpike + Math.random() * 400);
    points.push({
      timestamp: timestamp.toISOString(),
      clicks,
    });
  }
  return points;
}

export function useMockData() {
  const [links, setLinks] = useState<LinkItem[]>(MOCK_LINKS);
  const [timeSeries] = useState<TimeSeriesPoint[]>(generateTimeSeries);
  const [realtimeClicks, setRealtimeClicks] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setRealtimeClicks(Math.floor(Math.random() * 25 + 5));
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const totalClicks = links.reduce((sum, l) => sum + l.totalClicks, 0);

  const analytics: AnalyticsData = {
    totalClicks,
    clicksToday: 14832,
    clicksThisWeek: 89241,
    uniqueVisitors: Math.floor(totalClicks * 0.72),
    avgClicksPerDay: Math.floor(totalClicks / 30),
    peakClicksPerMinute: 342,
    geoData: MOCK_GEO,
    timeSeries,
    referrers: MOCK_REFERRERS,
  };

  const createLink = useCallback((url: string, rules: SmartRule[] = []) => {
    const chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    const code = Array.from({ length: 6 }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
    const newLink: LinkItem = {
      id: String(Date.now()),
      shortCode: code,
      originalUrl: url,
      totalClicks: 0,
      status: "active",
      createdAt: new Date().toISOString(),
      rules,
    };
    setLinks((prev) => [newLink, ...prev]);
    return newLink;
  }, []);

  return { links, analytics, realtimeClicks, createLink };
}
