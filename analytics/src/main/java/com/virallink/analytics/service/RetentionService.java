package com.virallink.analytics.service;

import com.virallink.analytics.repository.LinkAnalyticsRepository;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.time.LocalDateTime;
import java.time.ZoneOffset;

/**
 * Data retention: click records older than {@code analytics.retention.months} are deleted (privacy policy promise;
 * also keeps the database small). Runs at most once a day across all instances: called after each drain, it takes
 * a Redis lock that expires after 24 h. 0 months disables it.
 */
@Service
@Slf4j
public class RetentionService {

    static final String LAST_RUN_KEY = "analytics:retention:last-run";

    private final LinkAnalyticsRepository repository;
    private final StringRedisTemplate redis;
    private final int months;

    public RetentionService(LinkAnalyticsRepository repository, StringRedisTemplate redis,
                            @Value("${analytics.retention.months:12}") int months) {
        this.repository = repository;
        this.redis = redis;
        this.months = months;
    }

    /** Deletes expired clicks if today's run has not happened yet. Returns the number of rows deleted. */
    public int purgeIfDue() {
        if (months <= 0) return 0;
        try {
            Boolean due = redis.opsForValue().setIfAbsent(LAST_RUN_KEY, LocalDateTime.now(ZoneOffset.UTC).toString(),
                    Duration.ofHours(24));
            if (!Boolean.TRUE.equals(due)) return 0;
        } catch (Exception e) {
            log.warn("Retention check skipped, Redis unavailable: {}", e.getMessage());
            return 0;
        }
        int deleted = repository.deleteOlderThan(LocalDateTime.now(ZoneOffset.UTC).minusMonths(months));
        if (deleted > 0) log.info("Retention: deleted {} click records older than {} months", deleted, months);
        return deleted;
    }
}
