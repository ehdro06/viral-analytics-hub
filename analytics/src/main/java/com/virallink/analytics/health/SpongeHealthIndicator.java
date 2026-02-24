package com.virallink.analytics.health;

import com.virallink.analytics.service.AnalyticsSpongeService;
import lombok.RequiredArgsConstructor;

import org.springframework.boot.health.contributor.Health;
import org.springframework.boot.health.contributor.HealthIndicator;
import org.springframework.stereotype.Component;

import java.time.Instant;
import java.time.temporal.ChronoUnit;

@Component
@RequiredArgsConstructor
public class SpongeHealthIndicator implements HealthIndicator {

    private final AnalyticsSpongeService spongeService;

    @Override
    public Health health() {
        Instant lastRun = spongeService.getLastRunTime();
        
        if (lastRun == null) {
            return Health.unknown().withDetail("message", "Sponge hasn't run yet").build();
        }

        // If the sponge hasn't run in the last 10 seconds, something is wrong
        if (lastRun.isBefore(Instant.now().minus(10, ChronoUnit.SECONDS))) {
            return Health.down()
                    .withDetail("message", "Sponge thread appears stuck")
                    .withDetail("lastRun", lastRun.toString())
                    .build();
        }

        return Health.up()
                .withDetail("message", "Sponge is actively polling")
                .withDetail("lastRun", lastRun.toString())
                .build();
    }
}
