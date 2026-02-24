package com.virallink.analytics.dto;

import java.time.LocalDateTime;
import java.util.List;

public record AnalyticsSummaryResponse(
        long totalClicks,
        long clicksToday,
        long clicksThisWeek,
        long uniqueVisitors,
        long avgClicksPerDay,
        long peakClicksPerMinute,
        List<GeoData> geoData,
        List<TimeSeriesPoint> timeSeries,
        List<ReferrerData> referrers
) {
    public record GeoData(String country, String countryCode, long count) {}
    public record TimeSeriesPoint(LocalDateTime timestamp, long clicks) {}
    public record ReferrerData(String source, long clicks, double percentage) {}
}
