package com.virallink.analytics.service;

import com.virallink.analytics.events.ClickEventStreamFields;
import com.virallink.analytics.model.LinkAnalytics;
import com.virallink.analytics.repository.LinkAnalyticsRepository;
import io.lettuce.core.RedisCommandExecutionException;
import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.redis.RedisSystemException;
import org.springframework.data.redis.connection.stream.Consumer;
import org.springframework.data.redis.connection.stream.MapRecord;
import org.springframework.data.redis.connection.stream.ReadOffset;
import org.springframework.data.redis.connection.stream.RecordId;
import org.springframework.data.redis.connection.stream.StreamOffset;
import org.springframework.data.redis.connection.stream.StreamReadOptions;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;
import java.time.Instant;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.time.format.DateTimeParseException;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Optional;

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

    @Value("${analytics.sponge.batch-size:100}")
    private int batchSize;

    @Value("${analytics.sponge.read-block-ms:100}")
    private long readBlockMs;

    private volatile Instant lastRunTime;

    public Instant getLastRunTime() {
        return lastRunTime;
    }

    @PostConstruct
    public void init() {
        try {
            redisTemplate.opsForStream().createGroup(
                    ClickEventStreamFields.STREAM_KEY,
                    ReadOffset.from("0-0"),
                    CONSUMER_GROUP
            );
            log.info("Created Redis consumer group '{}' on stream '{}'.", CONSUMER_GROUP, ClickEventStreamFields.STREAM_KEY);
        } catch (RedisSystemException e) {
            if (e.getRootCause() instanceof RedisCommandExecutionException root
                    && root.getMessage() != null
                    && root.getMessage().contains("BUSYGROUP")) {
                log.info("Consumer group '{}' already exists on stream '{}'.", CONSUMER_GROUP, ClickEventStreamFields.STREAM_KEY);
            } else {
                log.error("Failed to initialize consumer group", e);
            }
        } catch (Exception e) {
            log.info("Consumer group init status: {}", e.getMessage());
        }
    }

    @Scheduled(fixedDelayString = "${analytics.sponge.poll-interval-ms:1000}")
    @Transactional
    public void spongeEvents() {
        lastRunTime = Instant.now();
        try {
            List<MapRecord<String, Object, Object>> messages = redisTemplate.opsForStream().read(
                    Consumer.from(CONSUMER_GROUP, CONSUMER_NAME),
                    StreamReadOptions.empty().count(batchSize).block(Duration.ofMillis(readBlockMs)),
                    StreamOffset.create(ClickEventStreamFields.STREAM_KEY, ReadOffset.lastConsumed())
            );

            if (messages == null || messages.isEmpty()) {
                return;
            }

            List<LinkAnalytics> toPersist = new ArrayList<>(messages.size());
            List<RecordId> persistAckIds = new ArrayList<>(messages.size());
            int skipped = 0;

            for (MapRecord<String, Object, Object> message : messages) {
                Optional<LinkAnalytics> mapped = mapEvent(message.getValue());
                if (mapped.isEmpty()) {
                    acknowledge(message.getId());
                    skipped++;
                    log.warn("Acknowledged invalid click event {} (missing shortCode)", message.getId());
                    continue;
                }
                toPersist.add(mapped.get());
                persistAckIds.add(message.getId());
            }

            if (!toPersist.isEmpty()) {
                analyticsRepository.saveAll(toPersist);
                acknowledgeAll(persistAckIds);
                log.info("Sponged {} events (skipped {})", toPersist.size(), skipped);
            } else if (skipped > 0) {
                log.debug("Batch contained only invalid events (skipped {})", skipped);
            }
        } catch (Exception e) {
            if (e.getMessage() != null && e.getMessage().contains("ERR no such key")) {
                return;
            }
            log.error("Error sponging analytics events (batch not acknowledged): {}", e.getMessage(), e);
            throw e instanceof RuntimeException re ? re : new RuntimeException(e);
        }
    }

    private void acknowledge(RecordId id) {
        redisTemplate.opsForStream().acknowledge(ClickEventStreamFields.STREAM_KEY, CONSUMER_GROUP, id);
    }

    private void acknowledgeAll(List<RecordId> ids) {
        if (ids.isEmpty()) {
            return;
        }
        redisTemplate.opsForStream().acknowledge(
                ClickEventStreamFields.STREAM_KEY,
                CONSUMER_GROUP,
                ids.toArray(RecordId[]::new)
        );
    }

    private Optional<LinkAnalytics> mapEvent(Map<Object, Object> body) {
        String shortCode = stringField(body, ClickEventStreamFields.SHORT_CODE);
        if (shortCode == null || shortCode.isBlank()) {
            return Optional.empty();
        }

        String ip = stringField(body, ClickEventStreamFields.IP);
        String ua = stringField(body, ClickEventStreamFields.UA);
        String ref = stringField(body, ClickEventStreamFields.REF);
        String timestampStr = stringField(body, ClickEventStreamFields.TIMESTAMP);
        Long userId = parseLongField(body, ClickEventStreamFields.USER_ID);
        Long linkId = parseLongField(body, ClickEventStreamFields.LINK_ID);

        ua_parser.Client client = userAgentService.parse(ua);
        String browser = (client != null && client.userAgent != null) ? client.userAgent.family : "Unknown";
        String os = (client != null && client.os != null) ? client.os.family : "Unknown";
        String device = (client != null && client.device != null) ? client.device.family : "Unknown";

        String country = geoService.getCountry(ip);
        String city = geoService.getCity(ip);

        return Optional.of(LinkAnalytics.builder()
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
                .build());
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
        if (timestampStr == null) {
            return LocalDateTime.now();
        }
        try {
            return LocalDateTime.ofInstant(Instant.parse(timestampStr), ZoneId.systemDefault());
        } catch (DateTimeParseException e) {
            return LocalDateTime.now();
        }
    }
}
