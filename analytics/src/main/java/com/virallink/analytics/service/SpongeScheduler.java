package com.virallink.analytics.service;

import lombok.RequiredArgsConstructor;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

/**
 * Polling mode (local dev default): drain the click stream every 500 ms. Needs CPU between requests, so on Cloud Run
 * production uses {@code analytics.sponge.mode=on-demand} instead (see {@link SpongeTriggerController}).
 */
@Component
@ConditionalOnProperty(name = "analytics.sponge.mode", havingValue = "poll", matchIfMissing = true)
@RequiredArgsConstructor
public class SpongeScheduler {

    private final AnalyticsSpongeService spongeService;

    @Scheduled(fixedDelay = 500)
    public void poll() {
        spongeService.spongeEvents();
    }
}
