package com.virallink.analytics.service;

import com.virallink.analytics.repository.LinkAnalyticsBatchWriter;
import com.virallink.analytics.repository.LinkAnalyticsBatchWriter.ClickRow;
import io.lettuce.core.RedisCommandExecutionException;
import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
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

import java.net.URI;
import java.time.Instant;
import java.time.LocalDateTime;
import java.time.ZoneOffset;
import java.time.format.DateTimeParseException;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

/**
 * The "sponge": soaks up click events from the Redis stream and flushes them to PostgreSQL in batches.
 *
 * <ul>
 *   <li>Each tick drains the stream in batches of {@value #BATCH_SIZE} (bounded per tick), one JDBC batch per read.</li>
 *   <li>Events are acknowledged (and removed from the stream) only after the batch is committed, so a DB outage
 *       or crash never loses clicks. They stay pending and are retried on the next tick (at-least-once delivery).</li>
 *   <li>A malformed event is logged and dropped: one bad event must never block the queue forever.</li>
 * </ul>
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class AnalyticsSpongeService {

    private final StringRedisTemplate redisTemplate;
    private final LinkAnalyticsBatchWriter batchWriter;
    private final GeoService geoService;
    private final UserAgentService userAgentService;

    private static final String ANALYTICS_STREAM_KEY = "analytics:events";
    private static final String CONSUMER_GROUP = "analytics-group";
    private static final String CONSUMER_NAME = "analytics-sponge-1";

    private static final int BATCH_SIZE = 500;
    private static final int MAX_BATCHES_PER_TICK = 20;

    private volatile Instant lastRunTime;

    public Instant getLastRunTime() {
        return lastRunTime;
    }

    @PostConstruct
    public void init() {
        ensureConsumerGroup();
    }

    @Scheduled(fixedDelay = 500)
    public void spongeEvents() {
        lastRunTime = Instant.now();
        try {
            drain(ReadOffset.from("0"));        // 1. our own unacknowledged events (crash / DB outage recovery)
            drain(ReadOffset.lastConsumed());   // 2. new events
        } catch (Exception e) {
            if (isMissingGroup(e)) {
                log.warn("Consumer group vanished (Redis flushed?). Recreating.");
                ensureConsumerGroup();
            } else if (e.getMessage() == null || !e.getMessage().contains("no such key")) {
                log.error("Error sponging analytics events: {}", e.getMessage());
            }
        }
    }

    private void drain(ReadOffset offset) {
        for (int i = 0; i < MAX_BATCHES_PER_TICK; i++) {
            List<MapRecord<String, Object, Object>> records = redisTemplate.opsForStream().read(
                    Consumer.from(CONSUMER_GROUP, CONSUMER_NAME),
                    StreamReadOptions.empty().count(BATCH_SIZE),
                    StreamOffset.create(ANALYTICS_STREAM_KEY, offset));

            if (records == null || records.isEmpty()) return;

            flush(records);
            if (records.size() < BATCH_SIZE) return;
        }
    }

    private void flush(List<MapRecord<String, Object, Object>> records) {
        List<RecordId> ids = new ArrayList<>(records.size());
        List<ClickRow> rows = new ArrayList<>(records.size());

        for (MapRecord<String, Object, Object> record : records) {
            ids.add(record.getId());
            try {
                rows.add(toRow(record.getValue()));
            } catch (Exception e) {
                log.warn("Dropping malformed click event {}: {}", record.getId(), e.getMessage());
            }
        }

        batchWriter.insertAll(rows); // throws on DB failure -> nothing is acknowledged -> retried next tick

        RecordId[] idArray = ids.toArray(new RecordId[0]);
        redisTemplate.opsForStream().acknowledge(ANALYTICS_STREAM_KEY, CONSUMER_GROUP, idArray);
        redisTemplate.opsForStream().delete(ANALYTICS_STREAM_KEY, idArray); // single consumer group: safe to remove
        log.info("Sponged {} events", rows.size());
    }

    private ClickRow toRow(Map<Object, Object> body) {
        String shortCode = required(body, "shortCode");
        if (shortCode.length() > 20) throw new IllegalArgumentException("shortCode too long");

        String ip = str(body, "ip");
        String ua = str(body, "ua");

        ua_parser.Client client = userAgentService.parse(ua);
        String browser = (client != null && client.userAgent != null) ? client.userAgent.family : "Unknown";
        String os = (client != null && client.os != null) ? client.os.family : "Unknown";
        String device = (client != null && client.device != null) ? client.device.family : "Unknown";

        GeoService.Geo geo = geoService.lookup(ip);

        return new ClickRow(
                shortCode,
                parseOwner(str(body, "owner")),
                parseTimestamp(str(body, "timestamp")),
                truncate(ip, 64),
                truncate(ua, 1000),
                referrerHost(str(body, "ref")),
                truncate(geo.country(), 255),
                truncate(geo.countryCode(), 8),
                truncate(geo.city(), 255),
                truncate(device, 255),
                truncate(browser, 255),
                truncate(os, 255));
    }

    private void ensureConsumerGroup() {
        try {
            // '0-0' so a fresh group also processes events that were queued before the sponge first started
            redisTemplate.opsForStream().createGroup(ANALYTICS_STREAM_KEY, ReadOffset.from("0-0"), CONSUMER_GROUP);
            log.info("Created Redis consumer group '{}'.", CONSUMER_GROUP);
        } catch (Exception e) {
            if (isBusyGroup(e)) {
                log.info("Redis consumer group '{}' already exists. Resuming consumption.", CONSUMER_GROUP);
            } else {
                log.warn("Consumer group init: {}", e.getMessage());
            }
        }
    }

    private static boolean isBusyGroup(Throwable e) {
        return e instanceof RedisSystemException && e.getCause() instanceof RedisCommandExecutionException
                && String.valueOf(e.getCause().getMessage()).contains("BUSYGROUP");
    }

    private static boolean isMissingGroup(Throwable e) {
        for (Throwable t = e; t != null; t = t.getCause()) {
            if (t.getMessage() != null && t.getMessage().contains("NOGROUP")) return true;
        }
        return false;
    }

    private static String str(Map<Object, Object> body, String key) {
        Object v = body.get(key);
        return v == null ? null : v.toString();
    }

    private static String required(Map<Object, Object> body, String key) {
        String v = str(body, key);
        if (v == null || v.isBlank()) throw new IllegalArgumentException("missing field '" + key + "'");
        return v;
    }

    private static Long parseOwner(String owner) {
        if (owner == null) return null;
        try {
            return Long.valueOf(owner);
        } catch (NumberFormatException e) {
            return null; // old-format event without an owner: stored, but visible to nobody
        }
    }

    private static LocalDateTime parseTimestamp(String timestamp) {
        if (timestamp == null) return LocalDateTime.now(ZoneOffset.UTC);
        try {
            return LocalDateTime.ofInstant(Instant.parse(timestamp), ZoneOffset.UTC);
        } catch (DateTimeParseException e) {
            return LocalDateTime.now(ZoneOffset.UTC);
        }
    }

    /** "https://www.Twitter.com/some/path?x=1" -> "twitter.com". Only the host is stored (privacy + useful grouping). */
    static String referrerHost(String referer) {
        if (referer == null || referer.isBlank() || "direct".equals(referer)) return "direct";
        try {
            String host = URI.create(referer.trim()).getHost();
            if (host == null || host.isBlank()) return "direct";
            host = host.toLowerCase();
            return truncate(host.startsWith("www.") ? host.substring(4) : host, 255);
        } catch (Exception e) {
            return "direct";
        }
    }

    private static String truncate(String value, int max) {
        if (value == null) return null;
        return value.length() <= max ? value : value.substring(0, max);
    }
}
