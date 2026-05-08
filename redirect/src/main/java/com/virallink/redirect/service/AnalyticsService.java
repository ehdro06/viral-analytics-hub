package com.virallink.redirect.service;

import com.virallink.redirect.events.ClickEventStreamFields;
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

    private static final String STATS_KEY_PREFIX = "stats:link:";

    @Async
    public void trackClick(String shortCode, long linkId, long userId, String ipAddress, String userAgent, String referer) {
        // Anonymize IP (GDPR Compliance - mask last octet)
        String anonymizedIp = anonymizeIp(ipAddress);

        try {
            // 1. Increment Redis Counter (Real-time stats)
            // Key: stats:link:{shortCode}:clicks
            redisTemplate.opsForValue().increment(STATS_KEY_PREFIX + shortCode + ":clicks");

            // 2. Push detailed event to Redis Stream (for future async processing/flushing to DB)
            Map<String, String> eventData = new HashMap<>();
            eventData.put(ClickEventStreamFields.USER_ID, Long.toString(userId));
            eventData.put(ClickEventStreamFields.LINK_ID, Long.toString(linkId));
            eventData.put(ClickEventStreamFields.SHORT_CODE, shortCode);
            eventData.put(ClickEventStreamFields.IP, anonymizedIp); // Store anonymized IP
            eventData.put(ClickEventStreamFields.UA, userAgent != null ? userAgent : "unknown");
            eventData.put(ClickEventStreamFields.REF, referer != null ? referer : "direct");
            eventData.put(ClickEventStreamFields.TIMESTAMP, Instant.now().toString());

            redisTemplate.opsForStream().add(ClickEventStreamFields.STREAM_KEY, eventData);
            
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
