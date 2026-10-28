package com.virallink.redirect.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.time.Clock;

@Configuration
public class RateLimitConfig {

    /** Per-user (or per-IP for anonymous expander calls) limits; 0 disables a limit. */
    public record RateLimits(int linksPerMinute, int linksPerDay, int expandPerMinute, int expandGlobalPerMinute) {}

    @Bean
    public RateLimits rateLimits(@Value("${ratelimit.links.per-minute:20}") int linksPerMinute,
                                 @Value("${ratelimit.links.per-day:500}") int linksPerDay,
                                 @Value("${ratelimit.expand.per-minute:20}") int expandPerMinute,
                                 @Value("${ratelimit.expand.global-per-minute:300}") int expandGlobalPerMinute) {
        return new RateLimits(linksPerMinute, linksPerDay, expandPerMinute, expandGlobalPerMinute);
    }

    @Bean
    public Clock clock() {
        return Clock.systemUTC();
    }
}
