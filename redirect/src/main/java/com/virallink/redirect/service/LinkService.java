package com.virallink.redirect.service;

import com.virallink.redirect.model.Link;
import com.virallink.redirect.repository.LinkRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.hashids.Hashids;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.support.TransactionTemplate;

import java.net.URI;
import java.net.URISyntaxException;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class LinkService {

    private static final int MAX_URL_LENGTH = 2048;
    private static final String STATS_KEY_PREFIX = "stats:link:";

    private final LinkRepository linkRepository;
    private final LinkCache linkCache;
    private final StringRedisTemplate redisTemplate;
    private final AnalyticsService analyticsService;
    private final UrlExpandService urlExpandService;
    private final TransactionTemplate transactionTemplate;
    private final Hashids hashids;

    /**
     * Create a short link.
     *
     * <p>Validation and the (slow, network) safety check run before the database transaction starts,
     * so we never hold a DB connection open while waiting on Google.
     */
    public Link createLink(String originalUrl, Long userId) {
        String url = validate(originalUrl);

        if (!urlExpandService.checkSafeBrowsing(url)) {
            throw new IllegalArgumentException("This URL was flagged as unsafe by Google Safe Browsing");
        }

        Link link = transactionTemplate.execute(status -> {
            // The short code is derived from the row id, so the row has to exist first. The placeholder is
            // unique per row: a shared placeholder (like "") would collide on the unique index between
            // concurrent creates and make them queue up behind each other.
            Link saved = linkRepository.save(Link.builder()
                    .longUrl(url)
                    .userId(userId)
                    .shortCode("pending-" + UUID.randomUUID())
                    .build());
            saved.setShortCode(hashids.encode(saved.getId())); // flushed as an UPDATE when the transaction commits
            return saved;
        });

        // Hydrate the cache so the link works instantly (no first-click DB hit)
        linkCache.put(link.getShortCode(), new LinkCache.Entry(link.getLongUrl(), link.getUserId()));
        log.info("Created link: {} -> {}", link.getShortCode(), url);
        return link;
    }

    /**
     * Resolve a short code (the redirect hot path):
     * 0. Reject codes that cannot possibly be ours (no Redis, no DB).
     * 1. Redis. A hit costs no database call.
     * 2. On a miss, PostgreSQL, then populate Redis (or remember the code as missing).
     * A click is only recorded for links that exist.
     */
    public Optional<String> resolveLink(String shortCode, String ipAddress, String userAgent, String referer) {
        if (!isWellFormed(shortCode)) {
            return Optional.empty();
        }

        LinkCache.Lookup cached = linkCache.get(shortCode);
        switch (cached.status()) {
            case HIT -> {
                return Optional.of(trackAndReturn(shortCode, cached.entry(), ipAddress, userAgent, referer));
            }
            case KNOWN_MISSING -> {
                return Optional.empty();
            }
            default -> { /* unknown: fall through to the database */ }
        }

        Optional<Link> found = linkRepository.findByShortCode(shortCode);
        if (found.isEmpty()) {
            linkCache.putMissing(shortCode);
            return Optional.empty();
        }

        LinkCache.Entry entry = new LinkCache.Entry(found.get().getLongUrl(), found.get().getUserId());
        linkCache.put(shortCode, entry);
        return Optional.of(trackAndReturn(shortCode, entry, ipAddress, userAgent, referer));
    }

    public List<Link> getLinksByUserId(Long userId) {
        List<Link> links = linkRepository.findByUserId(userId);
        if (links.isEmpty()) return links;

        // Enrich with real-time click counters from Redis using ONE round trip (MGET), not one per link
        try {
            List<String> keys = links.stream().map(l -> STATS_KEY_PREFIX + l.getShortCode() + ":clicks").toList();
            List<String> counts = redisTemplate.opsForValue().multiGet(keys);
            if (counts != null) {
                for (int i = 0; i < links.size(); i++) {
                    if (counts.get(i) != null) links.get(i).setClickCount(Long.parseLong(counts.get(i)));
                }
            }
        } catch (Exception e) {
            log.warn("Could not load click counters: {}", e.getMessage());
        }
        return links;
    }

    @Transactional
    public void deleteLink(Long id, Long userId) {
        linkRepository.findByIdAndUserId(id, userId).ifPresent(link -> {
            linkRepository.delete(link);
            linkCache.evict(link.getShortCode());
        });
    }

    private String trackAndReturn(String shortCode, LinkCache.Entry entry, String ip, String userAgent, String referer) {
        analyticsService.trackClick(shortCode, entry.ownerId(), ip, userAgent, referer);
        return entry.longUrl();
    }

    /** A code is ours only if it decodes to exactly one id and re-encodes to the same string. */
    private boolean isWellFormed(String shortCode) {
        try {
            long[] ids = hashids.decode(shortCode);
            return ids.length == 1 && hashids.encode(ids[0]).equals(shortCode);
        } catch (Exception e) {
            return false;
        }
    }

    private String validate(String raw) {
        if (raw == null || raw.isBlank()) {
            throw new IllegalArgumentException("URL is required");
        }
        String url = raw.trim();
        if (url.length() > MAX_URL_LENGTH) {
            throw new IllegalArgumentException("URL is too long (max " + MAX_URL_LENGTH + " characters)");
        }

        URI uri;
        try {
            uri = new URI(url);
        } catch (URISyntaxException e) {
            throw new IllegalArgumentException("Invalid URL format");
        }

        String scheme = uri.getScheme();
        if (scheme == null || !(scheme.equalsIgnoreCase("http") || scheme.equalsIgnoreCase("https"))) {
            throw new IllegalArgumentException("URL must start with http:// or https://");
        }
        if (uri.getHost() == null || uri.getHost().isBlank()) {
            throw new IllegalArgumentException("URL must include a host name");
        }
        if (uri.getUserInfo() != null) {
            throw new IllegalArgumentException("URLs with embedded credentials are not allowed");
        }
        return url;
    }
}
