package com.virallink.analytics.controller;

import com.virallink.analytics.dto.AnalyticsSummaryResponse;
import com.virallink.analytics.service.AnalyticsSummaryService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/analytics")
@RequiredArgsConstructor
public class AnalyticsController {

    private final AnalyticsSummaryService summaryService;

    /** Analytics for the authenticated user's own links only (the user id comes from the verified JWT). */
    @GetMapping("/summary")
    public AnalyticsSummaryResponse summary(@AuthenticationPrincipal Long userId) {
        return summaryService.getSummary(userId);
    }
}
