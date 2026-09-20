package com.virallink.analytics.dto;

import java.time.Instant;
import java.util.List;

public record AnalyticsSummaryResponse(
        long totalClicks,
        long clicksLastMinute,
        long clicksLast24h,
        long clicksLast7Days,
        long uniqueVisitors,
        long avgClicksPerDay,
        long peakClicksPerMinute,
        List<GeoData> geoData,
        List<TimeSeriesPoint> timeSeries,
        List<ReferrerData> referrers
) {
    public record GeoData(String country, String countryCode, long count) {}

    /** Serialised as an ISO-8601 instant ("...Z"), so browsers render it in the viewer's own time zone. */
    public record TimeSeriesPoint(Instant timestamp, long clicks) {}

    public record ReferrerData(String source, long clicks, double percentage) {}
}
