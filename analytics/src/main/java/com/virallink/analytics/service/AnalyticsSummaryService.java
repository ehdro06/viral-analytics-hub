package com.virallink.analytics.service;

import com.virallink.analytics.dto.AnalyticsSummaryResponse;
import com.virallink.analytics.repository.LinkAnalyticsRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class AnalyticsSummaryService {

    private final LinkAnalyticsRepository repo;

    public AnalyticsSummaryResponse getSummary(Long userId) {
        LocalDateTime startOfToday = LocalDate.now().atStartOfDay();
        LocalDateTime startOfWeek = LocalDateTime.now().minusDays(7);
        LocalDateTime startOf30Days = LocalDateTime.now().minusDays(30);

        long totalClicks = repo.countByUserId(userId);
        long clicksToday = repo.countByUserIdAndClickedAtAfter(userId, startOfToday);
        long clicksThisWeek = repo.countByUserIdAndClickedAtAfter(userId, startOfWeek);
        long uniqueVisitors = repo.countDistinctIpSince(userId, startOfWeek);

        long clicksLast30 = repo.countByUserIdAndClickedAtAfter(userId, startOf30Days);
        long avgClicksPerDay = clicksLast30 == 0 ? 0 : clicksLast30 / 30;

        long peakClicksPerMinute = repo.peakPerMinuteLastDay(userId);

        var geoData = repo.topCountries(userId).stream()
                .map(g -> new AnalyticsSummaryResponse.GeoData(g.getCountry(), g.getCountry(), g.getCount()))
                .collect(Collectors.toList());

        var referrersRaw = repo.topReferrers(userId);
        long refTotal = referrersRaw.stream().mapToLong(r -> r.getCount()).sum();
        var referrers = referrersRaw.stream()
                .map(r -> new AnalyticsSummaryResponse.ReferrerData(
                        r.getReferrer(),
                        r.getCount(),
                        refTotal == 0 ? 0.0 : (r.getCount() * 100.0 / refTotal)
                ))
                .collect(Collectors.toList());

        var timeSeries = repo.hourlyLast48h(userId).stream()
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
