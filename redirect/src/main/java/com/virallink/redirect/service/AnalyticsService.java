package com.virallink.redirect.service;

import com.virallink.redirect.util.IpAnonymizer;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.connection.RedisStreamCommands.XAddOptions;
import org.springframework.data.redis.connection.stream.StreamRecords;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.HashMap;
import java.util.Map;

@Service
@RequiredArgsConstructor
@Slf4j
public class AnalyticsService {

    private final StringRedisTemplate redisTemplate;

    private static final String ANALYTICS_STREAM_KEY = "analytics:events";
    private static final String STATS_KEY_PREFIX = "stats:link:";

    // Safety cap: if the analytics service is down for a long time the stream must not eat all of Redis' memory.
    // "~" (approximate) trimming is much cheaper than exact trimming.
    private static final XAddOptions STREAM_CAP = XAddOptions.maxlen(500_000).approximateTrimming(true);

    @Async
    public void trackClick(String shortCode, Long ownerId, String ipAddress, String userAgent, String referer) {
        try {
            // 1. Real-time counter (shown in the links table)
            redisTemplate.opsForValue().increment(STATS_KEY_PREFIX + shortCode + ":clicks");

            // 2. Detailed event for the analytics service to batch into PostgreSQL.
            //    The IP is anonymised here, before it ever leaves this service (GDPR).
            Map<String, String> eventData = new HashMap<>();
            eventData.put("shortCode", shortCode);
            eventData.put("owner", String.valueOf(ownerId));
            eventData.put("ip", IpAnonymizer.anonymize(ipAddress));
            eventData.put("ua", userAgent != null ? userAgent : "unknown");
            eventData.put("ref", referer != null ? referer : "direct");
            eventData.put("timestamp", Instant.now().toString());

            redisTemplate.opsForStream().add(
                    StreamRecords.newRecord().in(ANALYTICS_STREAM_KEY).ofMap(eventData), STREAM_CAP);

            log.debug("Tracked click for {}", shortCode);
        } catch (Exception e) {
            log.error("Failed to track click for {}: {}", shortCode, e.getMessage());
            // Do not rethrow - analytics failure should never impact the redirect
        }
    }
}
