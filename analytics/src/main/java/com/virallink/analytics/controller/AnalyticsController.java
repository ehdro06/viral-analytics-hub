package com.virallink.analytics.controller;

import com.virallink.analytics.dto.AnalyticsSummaryResponse;
import com.virallink.analytics.service.AnalyticsSummaryService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/analytics")
@RequiredArgsConstructor
public class AnalyticsController {

    private final AnalyticsSummaryService summaryService;

    @GetMapping("/summary")
    public AnalyticsSummaryResponse summary() {
        return summaryService.getSummary();
    }
}
