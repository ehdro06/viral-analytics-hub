package com.virallink.redirect.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Component;

import java.time.Duration;
import java.util.HashMap;
import java.util.Map;

/**
 * L1 cache for short_code -> link. Stored as a Redis hash so the redirect hot path also gets the
 * link owner (needed to attribute the click) without a database call.
 *
 * <p>The cache is best-effort: any Redis failure is logged and reported as "unknown", so the caller
 * falls back to PostgreSQL instead of failing the redirect. Redis is an optimisation, not a dependency.
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class LinkCache {

    private static final String PREFIX = "link:";
    private static final Duration TTL = Duration.ofMinutes(10);
    // Short TTL for "this code does not exist", so a burst of bad codes hits Postgres once, not every time.
    private static final Duration MISSING_TTL = Duration.ofSeconds(60);

    private static final String F_URL = "url";
    private static final String F_OWNER = "owner";
    private static final String F_MISSING = "missing";

    public record Entry(String longUrl, Long ownerId) {}

    public enum Status { HIT, KNOWN_MISSING, UNKNOWN }

    public record Lookup(Status status, Entry entry) {
        static final Lookup UNKNOWN = new Lookup(Status.UNKNOWN, null);
        static final Lookup KNOWN_MISSING = new Lookup(Status.KNOWN_MISSING, null);
    }

    private final StringRedisTemplate redis;

    public Lookup get(String shortCode) {
        try {
            Map<Object, Object> fields = redis.opsForHash().entries(PREFIX + shortCode);
            if (fields.isEmpty()) return Lookup.UNKNOWN;
            if (fields.containsKey(F_MISSING)) return Lookup.KNOWN_MISSING;

            Object url = fields.get(F_URL);
            Object owner = fields.get(F_OWNER);
            if (url == null || owner == null) return Lookup.UNKNOWN;
            return new Lookup(Status.HIT, new Entry(url.toString(), Long.valueOf(owner.toString())));
        } catch (Exception e) {
            log.warn("Link cache read failed for {}: {}", shortCode, e.getMessage());
            return Lookup.UNKNOWN;
        }
    }

    public void put(String shortCode, Entry entry) {
        Map<String, String> fields = new HashMap<>();
        fields.put(F_URL, entry.longUrl());
        fields.put(F_OWNER, String.valueOf(entry.ownerId()));
        write(shortCode, fields, TTL);
    }

    public void putMissing(String shortCode) {
        write(shortCode, Map.of(F_MISSING, "1"), MISSING_TTL);
    }

    public void evict(String shortCode) {
        try {
            redis.delete(PREFIX + shortCode);
        } catch (Exception e) {
            log.warn("Link cache evict failed for {}: {}", shortCode, e.getMessage());
        }
    }

    private void write(String shortCode, Map<String, String> fields, Duration ttl) {
        String key = PREFIX + shortCode;
        try {
            redis.delete(key); // also clears any value of the old plain-string format or a negative entry
            redis.opsForHash().putAll(key, fields);
            redis.expire(key, ttl);
        } catch (Exception e) {
            log.warn("Link cache write failed for {}: {}", shortCode, e.getMessage());
        }
    }
}
