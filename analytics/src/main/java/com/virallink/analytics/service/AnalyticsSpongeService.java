package com.virallink.analytics.service;

import com.virallink.analytics.events.ClickEventStreamFields;
import com.virallink.analytics.model.LinkAnalytics;
import com.virallink.analytics.repository.LinkAnalyticsRepository;
import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.connection.stream.*;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.time.Instant;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.time.format.DateTimeParseException;
import java.util.List;
import java.util.Map;

import org.springframework.data.redis.RedisSystemException;
import io.lettuce.core.RedisCommandExecutionException;

@Service
@RequiredArgsConstructor
@Slf4j
public class AnalyticsSpongeService {

    private final StringRedisTemplate redisTemplate;
    private final LinkAnalyticsRepository analyticsRepository;
    private final GeoService geoService;
    private final UserAgentService userAgentService;

    private static final String CONSUMER_GROUP = "analytics-group";
    private static final String CONSUMER_NAME = "analytics-sponge-1";

    private volatile Instant lastRunTime;

    public Instant getLastRunTime() {
        return lastRunTime;
    }

    @PostConstruct
    public void init() {
        try {
            // Create consumer group if not present
            // Reading from '0-0' ensures we process all history if we start fresh
            redisTemplate.opsForStream().createGroup(ClickEventStreamFields.STREAM_KEY, ReadOffset.from("0-0"), CONSUMER_GROUP);
            log.info("Successfully created Redis consumer group.");
        } catch (RedisSystemException e) {
            if (e.getRootCause() instanceof RedisCommandExecutionException && 
                e.getRootCause().getMessage().contains("BUSYGROUP")) {
                log.info("Redis consumer group '{}' already exists. Resuming consumption.", CONSUMER_GROUP);
            } else {
                log.error("Failed to initialize consumer group", e);
            }
        } catch (Exception e) {
            log.info("Consumer group init status: {}", e.getMessage());
        }
    }

    // Run every 1 second
    @Scheduled(fixedDelay = 1000)
    public void spongeEvents() {
        lastRunTime = Instant.now();
        try {
            // StringRedisTemplate typed read
            // StreamOperations<String, String, String>
            List<MapRecord<String, Object, Object>> messages = redisTemplate.opsForStream().read(
                Consumer.from(CONSUMER_GROUP, CONSUMER_NAME),
                StreamReadOptions.empty().count(100).block(Duration.ofMillis(100)),
                StreamOffset.create(ClickEventStreamFields.STREAM_KEY, ReadOffset.lastConsumed())
            );

            if (messages != null && !messages.isEmpty()) {
                for (MapRecord<String, Object, Object> message : messages) {
                    processEvent(message);
                    redisTemplate.opsForStream().acknowledge(ClickEventStreamFields.STREAM_KEY, CONSUMER_GROUP, message.getId());
                }
                log.info("Sponged {} events", messages.size());
            }
        } catch (Exception e) {
             // Handle "no such key" gracefully if stream is empty/not created yet
             if (e.getMessage() != null && !e.getMessage().contains("ERR no such key")) {
                log.error("Error sponging analytics events: {}", e.getMessage());
             }
        }
    }

    private void processEvent(MapRecord<String, Object, Object> message) {
        Map<Object, Object> body = message.getValue();
        
        String shortCode = stringField(body, ClickEventStreamFields.SHORT_CODE);
        String ip = stringField(body, ClickEventStreamFields.IP);
        String ua = stringField(body, ClickEventStreamFields.UA);
        String ref = stringField(body, ClickEventStreamFields.REF);
        String timestampStr = stringField(body, ClickEventStreamFields.TIMESTAMP);
        Long userId = parseLongField(body, ClickEventStreamFields.USER_ID);
        Long linkId = parseLongField(body, ClickEventStreamFields.LINK_ID);

        // Parse User Agent
        ua_parser.Client client = userAgentService.parse(ua);
        String browser = (client != null && client.userAgent != null) ? client.userAgent.family : "Unknown";
        String os = (client != null && client.os != null) ? client.os.family : "Unknown";
        String device = (client != null && client.device != null) ? client.device.family : "Unknown";

        // Geo IP
        String country = geoService.getCountry(ip);
        String city = geoService.getCity(ip);

        LinkAnalytics analytics = LinkAnalytics.builder()
                .userId(userId)
                .linkId(linkId)
                .shortCode(shortCode)
                .ipAddress(ip)
                .userAgent(ua)
                .referer(ref)
                .clickedAt(parseTimestamp(timestampStr))
                .browser(browser)
                .os(os)
                .deviceType(device)
                .country(country)
                .city(city)
                .build();

        analyticsRepository.save(analytics);
    }

    private static String stringField(Map<Object, Object> body, String key) {
        Object v = body.get(key);
        return v != null ? v.toString() : null;
    }

    private static Long parseLongField(Map<Object, Object> body, String key) {
        String s = stringField(body, key);
        if (s == null || s.isBlank()) {
            return null;
        }
        try {
            return Long.parseLong(s);
        } catch (NumberFormatException e) {
            return null;
        }
    }

    private LocalDateTime parseTimestamp(String timestampStr) {
        if (timestampStr == null) return LocalDateTime.now();
        try {
            return LocalDateTime.ofInstant(Instant.parse(timestampStr), ZoneId.systemDefault());
        } catch (DateTimeParseException e) {
            return LocalDateTime.now();
        }
    }
}
