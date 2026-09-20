package com.virallink.analytics.service;

import com.virallink.analytics.dto.AnalyticsSummaryResponse;
import com.virallink.analytics.repository.LinkAnalyticsRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.time.LocalDateTime;
import java.time.ZoneOffset;
import java.time.temporal.ChronoUnit;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class AnalyticsSummaryService {

    private static final int TIME_SERIES_HOURS = 48;

    private final LinkAnalyticsRepository repo;

    /** Summary of the clicks on links owned by {@code ownerId}. Timestamps are UTC throughout. */
    public AnalyticsSummaryResponse getSummary(Long ownerId) {
        LocalDateTime now = LocalDateTime.now(ZoneOffset.UTC);
        LocalDateTime minuteAgo = now.minusMinutes(1);
        LocalDateTime dayAgo = now.minusDays(1);
        LocalDateTime weekAgo = now.minusDays(7);
        LocalDateTime monthAgo = now.minusDays(30);

        long totalClicks = repo.countByOwnerId(ownerId);
        long clicksLastMinute = repo.countByOwnerIdAndClickedAtAfter(ownerId, minuteAgo);
        long clicksLast24h = repo.countByOwnerIdAndClickedAtAfter(ownerId, dayAgo);
        long clicksLast7Days = repo.countByOwnerIdAndClickedAtAfter(ownerId, weekAgo);
        long uniqueVisitors = repo.countDistinctIpSince(ownerId, weekAgo);
        long avgClicksPerDay = repo.countByOwnerIdAndClickedAtAfter(ownerId, monthAgo) / 30;
        long peakClicksPerMinute = repo.peakPerMinuteSince(ownerId, dayAgo);

        var geoData = repo.topCountries(ownerId).stream()
                .map(g -> new AnalyticsSummaryResponse.GeoData(g.getCountry(), g.getCode(), g.getCount()))
                .toList();

        var referrersRaw = repo.topReferrers(ownerId);
        long referrerTotal = referrersRaw.stream().mapToLong(r -> r.getCount()).sum();
        var referrers = referrersRaw.stream()
                .map(r -> new AnalyticsSummaryResponse.ReferrerData(
                        r.getReferrer(),
                        r.getCount(),
                        referrerTotal == 0 ? 0.0 : r.getCount() * 100.0 / referrerTotal))
                .toList();

        return new AnalyticsSummaryResponse(
                totalClicks, clicksLastMinute, clicksLast24h, clicksLast7Days, uniqueVisitors,
                avgClicksPerDay, peakClicksPerMinute, geoData, hourlySeries(ownerId, now), referrers);
    }

    /** Last 48 hourly buckets, oldest first, with empty hours filled with 0 so the chart line is continuous. */
    private List<AnalyticsSummaryResponse.TimeSeriesPoint> hourlySeries(Long ownerId, LocalDateTime now) {
        LocalDateTime currentHour = now.truncatedTo(ChronoUnit.HOURS);
        LocalDateTime from = currentHour.minusHours(TIME_SERIES_HOURS - 1L);

        Map<LocalDateTime, Long> counts = new HashMap<>();
        repo.hourlySince(ownerId, from).forEach(p -> counts.put(p.getBucket(), p.getCount()));

        return java.util.stream.IntStream.range(0, TIME_SERIES_HOURS)
                .mapToObj(i -> {
                    LocalDateTime bucket = from.plusHours(i);
                    Instant at = bucket.toInstant(ZoneOffset.UTC);
                    return new AnalyticsSummaryResponse.TimeSeriesPoint(at, counts.getOrDefault(bucket, 0L));
                })
                .toList();
    }
}
