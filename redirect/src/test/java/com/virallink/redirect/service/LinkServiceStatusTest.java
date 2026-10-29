package com.virallink.redirect.service;

import com.virallink.redirect.model.Link;
import com.virallink.redirect.repository.LinkRepository;
import com.virallink.redirect.service.LinkService.Resolution;
import org.hashids.Hashids;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.transaction.support.SimpleTransactionStatus;
import org.springframework.transaction.support.TransactionCallback;
import org.springframework.transaction.support.TransactionTemplate;

import java.time.Duration;
import java.time.Instant;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class LinkServiceStatusTest {

    private static final Hashids HASHIDS = new Hashids("test-salt", 6);
    private static final String CODE = HASHIDS.encode(7L);

    private final LinkRepository repository = mock(LinkRepository.class);
    private final LinkCache cache = mock(LinkCache.class);
    private final AnalyticsService analytics = mock(AnalyticsService.class);
    private final TransactionTemplate tx = mock(TransactionTemplate.class);
    private LinkService service;

    @BeforeEach
    @SuppressWarnings("unchecked")
    void setUp() {
        when(tx.execute(any())).thenAnswer(inv -> ((TransactionCallback<Object>) inv.getArgument(0))
                .doInTransaction(new SimpleTransactionStatus()));
        when(repository.save(any(Link.class))).thenAnswer(inv -> inv.getArgument(0));
        service = new LinkService(repository, cache, mock(StringRedisTemplate.class), analytics,
                mock(UrlExpandService.class), tx, HASHIDS);
    }

    private static LinkCache.Lookup hit(boolean paused, Instant expiresAt) {
        return new LinkCache.Lookup(LinkCache.Status.HIT,
                new LinkCache.Entry("https://example.com", 42L, paused, expiresAt));
    }

    private static Link link(boolean paused, Instant expiresAt) {
        return Link.builder().id(7L).shortCode(CODE).longUrl("https://example.com").userId(42L)
                .paused(paused).expiresAt(expiresAt).build();
    }

    @Test
    void activeLink_RedirectsAndCountsTheClick() {
        when(cache.get(CODE)).thenReturn(hit(false, Instant.now().plus(Duration.ofDays(1))));

        Resolution r = service.resolveLink(CODE, "1.2.3.4", "ua", "ref");

        assertThat(r.kind()).isEqualTo(Resolution.Kind.REDIRECT);
        assertThat(r.longUrl()).isEqualTo("https://example.com");
        verify(analytics).trackClick(eq(CODE), eq(42L), anyString(), anyString(), anyString());
    }

    @Test
    void pausedLink_IsInactiveAndNotCounted() {
        when(cache.get(CODE)).thenReturn(hit(true, null));

        assertThat(service.resolveLink(CODE, "1.2.3.4", "ua", "ref").kind()).isEqualTo(Resolution.Kind.INACTIVE);
        verify(analytics, never()).trackClick(any(), any(), any(), any(), any());
    }

    @Test
    void expiredLink_IsInactiveAndNotCounted() {
        when(cache.get(CODE)).thenReturn(hit(false, Instant.now().minusSeconds(1)));

        assertThat(service.resolveLink(CODE, "1.2.3.4", "ua", "ref").kind()).isEqualTo(Resolution.Kind.INACTIVE);
        verify(analytics, never()).trackClick(any(), any(), any(), any(), any());
    }

    @Test
    void cacheMiss_PausedLinkFromDatabase_IsInactiveAndCachedWithItsStatus() {
        when(cache.get(CODE)).thenReturn(new LinkCache.Lookup(LinkCache.Status.UNKNOWN, null));
        when(repository.findByShortCode(CODE)).thenReturn(Optional.of(link(true, null)));

        assertThat(service.resolveLink(CODE, "1.2.3.4", "ua", "ref").kind()).isEqualTo(Resolution.Kind.INACTIVE);
        verify(cache).put(CODE, new LinkCache.Entry("https://example.com", 42L, true, null));
    }

    @Test
    void unknownCode_IsNotFound() {
        assertThat(service.resolveLink("not-ours", "1.2.3.4", "ua", "ref").kind()).isEqualTo(Resolution.Kind.NOT_FOUND);
    }

    @Test
    void update_PausesAndSetsExpiry_AndRefreshesCache() {
        Instant expiry = Instant.now().plus(Duration.ofDays(3));
        when(repository.findByIdAndUserId(7L, 42L)).thenReturn(Optional.of(link(false, null)));

        Link updated = service.updateStatus(7L, 42L, true, expiry).orElseThrow();

        assertThat(updated.isPaused()).isTrue();
        assertThat(updated.getExpiresAt()).isEqualTo(expiry);
        assertThat(updated.getStatus()).isEqualTo("paused");
        verify(cache).put(CODE, new LinkCache.Entry("https://example.com", 42L, true, expiry));
    }

    @Test
    void update_RejectsANewExpiryInThePast() {
        when(repository.findByIdAndUserId(7L, 42L)).thenReturn(Optional.of(link(false, null)));

        assertThatThrownBy(() -> service.updateStatus(7L, 42L, false, Instant.now().minusSeconds(60)))
                .isInstanceOf(IllegalArgumentException.class);
    }

    @Test
    void update_KeepsAnAlreadyPassedExpiryWhenOnlyPausing() {
        Instant past = Instant.now().minus(Duration.ofDays(1));
        when(repository.findByIdAndUserId(7L, 42L)).thenReturn(Optional.of(link(false, past)));

        Link updated = service.updateStatus(7L, 42L, true, past).orElseThrow();

        assertThat(updated.isPaused()).isTrue();
        assertThat(updated.getExpiresAt()).isEqualTo(past);
    }

    @Test
    void update_SomeoneElsesLink_IsEmpty() {
        when(repository.findByIdAndUserId(7L, 99L)).thenReturn(Optional.empty());

        assertThat(service.updateStatus(7L, 99L, true, null)).isEmpty();
        verify(cache, never()).put(any(), any());
    }

    @Test
    void status_ReflectsPausedExpiredActive() {
        assertThat(link(true, null).getStatus()).isEqualTo("paused");
        assertThat(link(false, Instant.now().minusSeconds(1)).getStatus()).isEqualTo("expired");
        assertThat(link(false, Instant.now().plusSeconds(60)).getStatus()).isEqualTo("active");
        assertThat(link(false, null).getStatus()).isEqualTo("active");
    }
}
