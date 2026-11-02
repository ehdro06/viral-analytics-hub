package com.virallink.analytics.service;

import com.virallink.analytics.repository.LinkAnalyticsRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.springframework.data.redis.RedisConnectionFailureException;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.data.redis.core.ValueOperations;

import java.time.Duration;
import java.time.LocalDateTime;
import java.time.ZoneOffset;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class RetentionServiceTest {

    private final LinkAnalyticsRepository repository = mock(LinkAnalyticsRepository.class);
    private final StringRedisTemplate redis = mock(StringRedisTemplate.class);
    @SuppressWarnings("unchecked")
    private final ValueOperations<String, String> ops = mock(ValueOperations.class);

    @BeforeEach
    void setUp() {
        when(redis.opsForValue()).thenReturn(ops);
    }

    @Test
    void due_DeletesClicksOlderThanTheRetentionPeriod() {
        when(ops.setIfAbsent(eq(RetentionService.LAST_RUN_KEY), anyString(), eq(Duration.ofHours(24)))).thenReturn(true);
        when(repository.deleteOlderThan(any())).thenReturn(5);

        assertThat(new RetentionService(repository, redis, 12).purgeIfDue()).isEqualTo(5);

        ArgumentCaptor<LocalDateTime> cutoff = ArgumentCaptor.forClass(LocalDateTime.class);
        verify(repository).deleteOlderThan(cutoff.capture());
        LocalDateTime expected = LocalDateTime.now(ZoneOffset.UTC).minusMonths(12);
        assertThat(Duration.between(cutoff.getValue(), expected).abs()).isLessThan(Duration.ofMinutes(1));
    }

    @Test
    void alreadyRanToday_DoesNothing() {
        when(ops.setIfAbsent(anyString(), anyString(), any(Duration.class))).thenReturn(false);

        assertThat(new RetentionService(repository, redis, 12).purgeIfDue()).isZero();
        verify(repository, never()).deleteOlderThan(any());
    }

    @Test
    void zeroMonths_Disabled() {
        assertThat(new RetentionService(repository, redis, 0).purgeIfDue()).isZero();
        verify(redis, never()).opsForValue();
        verify(repository, never()).deleteOlderThan(any());
    }

    @Test
    void redisDown_SkipsInsteadOfFailingTheDrain() {
        when(ops.setIfAbsent(anyString(), anyString(), any(Duration.class)))
                .thenThrow(new RedisConnectionFailureException("down"));

        assertThat(new RetentionService(repository, redis, 12).purgeIfDue()).isZero();
        verify(repository, never()).deleteOlderThan(any());
    }
}
