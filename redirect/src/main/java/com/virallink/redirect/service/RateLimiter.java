package com.virallink.redirect.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Component;

import java.time.Clock;
import java.time.Duration;

/**
 * Fixed-window rate limiter on Redis counters, shared by every instance of the service.
 *
 * <p>Each call increments {@code rl:<bucket>:<subject>:<window number>}; the key expires with its window. Fails open:
 * if Redis is unreachable the request is allowed, because a broken limiter must not take link creation down with it.
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class RateLimiter {

    private final StringRedisTemplate redis;
    private final Clock clock;

    /** Thrown when a limit is exceeded; mapped to HTTP 429 with a Retry-After header. */
    public static class LimitExceededException extends RuntimeException {
        private final long retryAfterSeconds;

        public LimitExceededException(String message, long retryAfterSeconds) {
            super(message);
            this.retryAfterSeconds = retryAfterSeconds;
        }

        public long getRetryAfterSeconds() {
            return retryAfterSeconds;
        }
    }

    /**
     * Counts one request for {@code subject} in {@code bucket} and throws if it is over {@code limit} for the current
     * window. A limit of 0 or less disables the check.
     */
    public void check(String bucket, String subject, int limit, Duration window, String message) {
        if (limit <= 0) return;
        long windowSeconds = window.toSeconds();
        long nowSeconds = clock.millis() / 1000;
        long windowNumber = nowSeconds / windowSeconds;
        String key = "rl:" + bucket + ":" + subject + ":" + windowNumber;

        Long count;
        try {
            count = redis.opsForValue().increment(key);
            if (count != null && count == 1) {
                redis.expire(key, window);
            }
        } catch (Exception e) {
            log.warn("Rate limiter unavailable ({}), allowing request: {}", bucket, e.getMessage());
            return;
        }
        if (count != null && count > limit) {
            long retryAfter = (windowNumber + 1) * windowSeconds - nowSeconds;
            throw new LimitExceededException(message, Math.max(1, retryAfter));
        }
    }
}
