package com.virallink.analytics.service;

import com.virallink.analytics.dto.AnalyticsSummaryResponse;
import com.virallink.analytics.repository.LinkAnalyticsRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class AnalyticsSummaryService {

    private final LinkAnalyticsRepository repo;

    public AnalyticsSummaryResponse getSummary() {
        LocalDateTime startOfToday = LocalDate.now().atStartOfDay();
        LocalDateTime startOfWeek = LocalDateTime.now().minusDays(7);
        LocalDateTime startOf30Days = LocalDateTime.now().minusDays(30);

        long totalClicks = repo.count();
        long clicksToday = repo.countByClickedAtAfter(startOfToday);
        long clicksThisWeek = repo.countByClickedAtAfter(startOfWeek);
        long uniqueVisitors = repo.countDistinctIpSince(startOfWeek);

        long clicksLast30 = repo.countByClickedAtAfter(startOf30Days);
        long avgClicksPerDay = clicksLast30 / 30;

        long peakClicksPerMinute = repo.peakPerMinuteLastDay();

        var geoData = repo.topCountries().stream()
                .map(g -> new AnalyticsSummaryResponse.GeoData(g.getCountry(), g.getCountry(), g.getCount()))
                .collect(Collectors.toList());

        var referrersRaw = repo.topReferrers();
        long refTotal = referrersRaw.stream().mapToLong(r -> r.getCount()).sum();
        var referrers = referrersRaw.stream()
                .map(r -> new AnalyticsSummaryResponse.ReferrerData(
                        r.getReferrer(),
                        r.getCount(),
                        refTotal == 0 ? 0.0 : (r.getCount() * 100.0 / refTotal)
                ))
                .collect(Collectors.toList());

        var timeSeries = repo.hourlyLast48h().stream()
                .map(t -> new AnalyticsSummaryResponse.TimeSeriesPoint(t.getBucket(), t.getCount()))
                .collect(Collectors.toList());

        return new AnalyticsSummaryResponse(
                totalClicks,
                clicksToday,
                clicksThisWeek,
                uniqueVisitors,
                avgClicksPerDay,
                peakClicksPerMinute,
                geoData,
                timeSeries,
                referrers
        );
    }
}
