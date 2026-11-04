package com.virallink.analytics.service;

import com.virallink.analytics.repository.LinkAnalyticsBatchWriter;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.data.redis.connection.stream.MapRecord;
import org.springframework.data.redis.connection.stream.ReadOffset;
import org.springframework.data.redis.connection.stream.RecordId;
import org.springframework.data.redis.connection.stream.StreamOffset;
import org.springframework.data.redis.connection.stream.StreamRecords;
import org.springframework.data.redis.core.StreamOperations;
import org.springframework.data.redis.core.StringRedisTemplate;

import java.time.Duration;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.concurrent.atomic.AtomicInteger;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

/** How much one call drains: a polling tick is bounded, an on-demand drain empties the stream (within its budget). */
class AnalyticsSpongeServiceDrainTest {

    private static final int BATCH = 500;

    private StreamOperations<String, Object, Object> stream;
    private AnalyticsSpongeService service;
    private int backlog;
    private final AtomicInteger nextId = new AtomicInteger();

    @BeforeEach
    @SuppressWarnings("unchecked")
    void setUp() {
        StringRedisTemplate redis = mock(StringRedisTemplate.class);
        stream = mock(StreamOperations.class);
        when(redis.opsForStream()).thenReturn((StreamOperations) stream);

        GeoService geo = mock(GeoService.class);
        when(geo.lookup(any())).thenReturn(new GeoService.Geo("Unknown", "XX", "Unknown"));

        service = new AnalyticsSpongeService(redis, mock(LinkAnalyticsBatchWriter.class), geo, mock(UserAgentService.class));

        // Pending entries ("0") are empty; new entries come from the backlog, BATCH at a time
        when(stream.read(any(org.springframework.data.redis.connection.stream.Consumer.class),
                any(org.springframework.data.redis.connection.stream.StreamReadOptions.class),
                any(StreamOffset.class)))
                .thenAnswer(inv -> {
                    StreamOffset<String> offset = inv.getArgument(2);
                    if (offset.getOffset().equals(ReadOffset.from("0"))) return List.of();
                    int n = Math.min(BATCH, backlog);
                    backlog -= n;
                    return records(n);
                });
    }

    @Test
    void pollingTick_StopsAfterTwentyBatches() {
        backlog = 25_000;
        assertThat(service.spongeEvents()).isEqualTo(10_000);
        assertThat(backlog).isEqualTo(15_000);
    }

    @Test
    void onDemandDrain_EmptiesTheStream() {
        backlog = 25_000;
        assertThat(service.drainUntilEmpty(Duration.ofSeconds(30))).isEqualTo(25_000);
        assertThat(backlog).isZero();
    }

    @Test
    void onDemandDrain_StopsWhenTheBudgetIsUsedUp() {
        backlog = 25_000;
        assertThat(service.drainUntilEmpty(Duration.ZERO)).isZero();
        assertThat(backlog).isEqualTo(25_000); // left for the next call
    }

    private List<MapRecord<String, Object, Object>> records(int n) {
        List<MapRecord<String, Object, Object>> list = new ArrayList<>(n);
        for (int i = 0; i < n; i++) {
            Map<Object, Object> body = Map.of("shortCode", "abc", "owner", "1", "ip", "203.0.113.0",
                    "ua", "k6", "timestamp", "2026-11-04T00:00:00Z");
            list.add(StreamRecords.newRecord().in("analytics:events")
                    .withId(RecordId.of(1, nextId.incrementAndGet())).ofMap(body));
        }
        return list;
    }
}
