package com.virallink.analytics.controller;

import com.virallink.analytics.dto.AnalyticsSummaryResponse;
import com.virallink.analytics.repository.LinkAnalyticsRepository;
import com.virallink.analytics.service.AnalyticsSummaryService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
@RequestMapping("/api/v1/analytics")
@RequiredArgsConstructor
public class AnalyticsController {

    private final AnalyticsSummaryService summaryService;
    private final LinkAnalyticsRepository repository;

    /** Analytics for the authenticated user's own links only (the user id comes from the verified JWT). */
    @GetMapping("/summary")
    public AnalyticsSummaryResponse summary(@AuthenticationPrincipal Long userId) {
        return summaryService.getSummary(userId);
    }

    /** Account deletion: removes every click recorded on the authenticated user's links. */
    @DeleteMapping("/me")
    public Map<String, Integer> deleteMyData(@AuthenticationPrincipal Long userId) {
        return Map.of("deleted", repository.deleteByOwner(userId));
    }
}
