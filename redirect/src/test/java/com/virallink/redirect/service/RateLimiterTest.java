package com.virallink.redirect.service;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.data.redis.RedisConnectionFailureException;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.data.redis.core.ValueOperations;

import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.time.ZoneOffset;
import java.util.HashMap;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatCode;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class RateLimiterTest {

    // 10:00:20 UTC: 40 seconds left in the current minute window
    private static final Clock CLOCK = Clock.fixed(Instant.parse("2026-10-28T10:00:20Z"), ZoneOffset.UTC);

    private final StringRedisTemplate redis = mock(StringRedisTemplate.class);
    @SuppressWarnings("unchecked")
    private final ValueOperations<String, String> ops = mock(ValueOperations.class);
    private final Map<String, Long> counters = new HashMap<>();
    private RateLimiter limiter;

    @BeforeEach
    void setUp() {
        when(redis.opsForValue()).thenReturn(ops);
        when(ops.increment(anyString())).thenAnswer(inv -> counters.merge(inv.getArgument(0), 1L, Long::sum));
        limiter = new RateLimiter(redis, CLOCK);
    }

    @Test
    void allowsUpToTheLimit_ThenRejectsWithRetryAfter() {
        for (int i = 0; i < 3; i++) {
            limiter.check("links-minute", "42", 3, Duration.ofMinutes(1), "slow down");
        }
        assertThatThrownBy(() -> limiter.check("links-minute", "42", 3, Duration.ofMinutes(1), "slow down"))
                .isInstanceOf(RateLimiter.LimitExceededException.class)
                .hasMessage("slow down")
                .satisfies(e -> assertThat(((RateLimiter.LimitExceededException) e).getRetryAfterSeconds()).isEqualTo(40));
    }

    @Test
    void countsEachSubjectSeparately() {
        limiter.check("links-minute", "42", 1, Duration.ofMinutes(1), "x");
        assertThatCode(() -> limiter.check("links-minute", "43", 1, Duration.ofMinutes(1), "x")).doesNotThrowAnyException();
    }

    @Test
    void setsTheExpiryOnlyOnTheFirstHitOfAWindow() {
        limiter.check("links-minute", "42", 5, Duration.ofMinutes(1), "x");
        limiter.check("links-minute", "42", 5, Duration.ofMinutes(1), "x");
        verify(redis, times(1)).expire(anyString(), eq(Duration.ofMinutes(1)));
    }

    @Test
    void failsOpenWhenRedisIsDown() {
        when(ops.increment(anyString())).thenThrow(new RedisConnectionFailureException("down"));
        assertThatCode(() -> limiter.check("links-minute", "42", 1, Duration.ofMinutes(1), "x")).doesNotThrowAnyException();
    }

    @Test
    void zeroDisablesTheLimit() {
        limiter.check("links-minute", "42", 0, Duration.ofMinutes(1), "x");
        verify(ops, never()).increment(anyString());
    }
}
