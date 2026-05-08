package com.virallink.redirect.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.hashids.Hashids;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.virallink.redirect.model.Link;
import com.virallink.redirect.repository.LinkRepository;

import java.net.URI;
import java.net.URISyntaxException;
import java.time.Duration;
import java.util.Map;
import java.util.Optional;

@Service
@RequiredArgsConstructor
@Slf4j
public class LinkService {

    private final LinkRepository linkRepository;
    private final StringRedisTemplate redisTemplate;
    private final AnalyticsService analyticsService;
    
    @Autowired
    private Hashids hashids;

    /** Legacy: plain string value (long URL only). Migrated to {@link #REDIS_LINK_HASH_PREFIX} on read. */
    private static final String REDIS_PREFIX = "link:";
    /** Hash: url, linkId, userId — avoids extra DB hits on the redirect hot path. */
    private static final String REDIS_LINK_HASH_PREFIX = "link:cache:";
    private static final Duration CACHE_TTL = Duration.ofMinutes(10); // Hot Path TTL

    /**
     * Create a short link.
     */
    @Transactional
    public Link createLink(String originalUrl, Long userId) {
        validateUrl(originalUrl);
        
        // Save first to get ID
        Link link = Link.builder()
                .longUrl(originalUrl)
                .userId(userId)
                .shortCode("") // temporary
                .build();
        
        link = linkRepository.save(link);
        
        // Generate Short Code from ID using Hashids
        String shortCode = hashids.encode(link.getId());
        link.setShortCode(shortCode);
        
        // Update DB
        linkRepository.save(link);
        
        cacheLinkHash(link.getShortCode(), link);
        log.info("Created link: {} -> {}", shortCode, originalUrl);
        
        return link;
    }

    /**
     * Resolve short link.
     * 1. Check Redis (Hot Path).
     * 2. If miss, check DB (Cold Path).
     * 3. Hydrate Redis if found in DB.
     */
    public Optional<String> resolveLink(String shortCode, String ipAddress, String userAgent, String referer) {
        String legacyKey = REDIS_PREFIX + shortCode;

        Optional<Link> fromHash = readLinkFromHash(shortCode);
        if (fromHash.isPresent()) {
            Link link = fromHash.get();
            log.debug("Cache Hit (hash): {}", shortCode);
            analyticsService.trackClick(shortCode, link.getId(), link.getUserId(), ipAddress, userAgent, referer);
            return Optional.of(link.getLongUrl());
        }

        String legacyUrl = redisTemplate.opsForValue().get(legacyKey);
        if (legacyUrl != null) {
            redisTemplate.delete(legacyKey);
            Optional<Link> linkOpt = linkRepository.findByShortCode(shortCode);
            if (linkOpt.isEmpty()) {
                return Optional.empty();
            }
            Link link = linkOpt.get();
            cacheLinkHash(shortCode, link);
            analyticsService.trackClick(shortCode, link.getId(), link.getUserId(), ipAddress, userAgent, referer);
            return Optional.of(link.getLongUrl());
        }

        log.debug("Cache Miss: {}", shortCode);
        Optional<Link> linkOpt = linkRepository.findByShortCode(shortCode);
        if (linkOpt.isPresent()) {
            Link link = linkOpt.get();
            cacheLinkHash(shortCode, link);
            analyticsService.trackClick(shortCode, link.getId(), link.getUserId(), ipAddress, userAgent, referer);
            return Optional.of(link.getLongUrl());
        }

        return Optional.empty();
    }

    private Optional<Link> readLinkFromHash(String shortCode) {
        String hashKey = REDIS_LINK_HASH_PREFIX + shortCode;
        if (!Boolean.TRUE.equals(redisTemplate.hasKey(hashKey))) {
            return Optional.empty();
        }
        Map<Object, Object> entries = redisTemplate.opsForHash().entries(hashKey);
        if (entries == null || entries.isEmpty()) {
            return Optional.empty();
        }
        Object urlObj = entries.get("url");
        Object linkIdObj = entries.get("linkId");
        Object userIdObj = entries.get("userId");
        if (urlObj == null || linkIdObj == null || userIdObj == null) {
            return Optional.empty();
        }
        try {
            Link synthetic = Link.builder()
                    .id(Long.parseLong(linkIdObj.toString()))
                    .userId(Long.parseLong(userIdObj.toString()))
                    .longUrl(urlObj.toString())
                    .shortCode(shortCode)
                    .build();
            return Optional.of(synthetic);
        } catch (NumberFormatException e) {
            log.warn("Invalid link cache hash at {}: {}", hashKey, e.getMessage());
            return Optional.empty();
        }
    }

    private void cacheLinkHash(String shortCode, Link link) {
        String hashKey = REDIS_LINK_HASH_PREFIX + shortCode;
        redisTemplate.opsForHash().put(hashKey, "url", link.getLongUrl());
        redisTemplate.opsForHash().put(hashKey, "linkId", Long.toString(link.getId()));
        redisTemplate.opsForHash().put(hashKey, "userId", Long.toString(link.getUserId()));
        redisTemplate.expire(hashKey, CACHE_TTL);
    }

    public java.util.List<Link> getLinksByUserId(Long userId) {
        java.util.List<Link> links = linkRepository.findByUserId(userId);
        
        // Enrich with real-time stats from Redis (The "Single Source Aggregation" Pattern)
        links.forEach(link -> {
            String clicks = redisTemplate.opsForValue().get("stats:link:" + link.getShortCode() + ":clicks");
            if (clicks != null) {
                link.setClickCount(Long.parseLong(clicks));
            }
        });
        
        return links;
    }
    
    @Transactional
    public void deleteLink(Long id, Long userId) {
        Optional<Link> link = linkRepository.findByIdAndUserId(id, userId);
        if (link.isPresent()) {
            Link l = link.get();
            String code = l.getShortCode();
            redisTemplate.delete(REDIS_PREFIX + code);
            redisTemplate.delete(REDIS_LINK_HASH_PREFIX + code);
            linkRepository.delete(l);
        }
    }

    private void validateUrl(String url) {
        try {
            new URI(url);
            // Basic check, could add regex for http protocol etc.
            if (!url.startsWith("http")) {
                throw new IllegalArgumentException("URL must start with http or https");
            }
        } catch (URISyntaxException e) {
            throw new IllegalArgumentException("Invalid URL format");
        }
    }
}
