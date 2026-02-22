package com.virallink.redirect.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
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

    @Async
    public void trackClick(String shortCode, String ipAddress, String userAgent, String referer) {
        // Anonymize IP (GDPR Compliance - mask last octet)
        String anonymizedIp = anonymizeIp(ipAddress);

        try {
            // 1. Increment Redis Counter (Real-time stats)
            // Key: stats:link:{shortCode}:clicks
            redisTemplate.opsForValue().increment(STATS_KEY_PREFIX + shortCode + ":clicks");

            // 2. Push detailed event to Redis Stream (for future async processing/flushing to DB)
            Map<String, String> eventData = new HashMap<>();
            eventData.put("shortCode", shortCode);
            eventData.put("ip", anonymizedIp); // Store anonymized IP
            eventData.put("ua", userAgent != null ? userAgent : "unknown");
            eventData.put("ref", referer != null ? referer : "direct");
            eventData.put("timestamp", Instant.now().toString());

            redisTemplate.opsForStream().add(ANALYTICS_STREAM_KEY, eventData);
            
            log.debug("Tracked click for {}", shortCode);
        } catch (Exception e) {
            log.error("Failed to track click for {}: {}", shortCode, e.getMessage());
            // Do not rethrow - analytics failure should not impact redirect flow
        }
    }

    private String anonymizeIp(String ip) {
        if (ip == null) return "unknown";
        int lastDotIndex = ip.lastIndexOf('.');
        if (lastDotIndex != -1) {
            return ip.substring(0, lastDotIndex) + ".0"; 
        }
        // Handle IPv6 if necessary, simple implementation for now
        return ip;
    }
}
