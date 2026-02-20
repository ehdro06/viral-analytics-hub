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
import java.util.Optional;

@Service
@RequiredArgsConstructor
@Slf4j
public class LinkService {

    private final LinkRepository linkRepository;
    private final StringRedisTemplate redisTemplate;
    
    @Autowired
    private Hashids hashids;

    private static final String REDIS_PREFIX = "link:";
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
        
        // Hydrate Redis
        redisTemplate.opsForValue().set(REDIS_PREFIX + shortCode, originalUrl, CACHE_TTL);
        log.info("Created link: {} -> {}", shortCode, originalUrl);
        
        return link;
    }

    /**
     * Resolve short link.
     * 1. Check Redis (Hot Path).
     * 2. If miss, check DB (Cold Path).
     * 3. Hydrate Redis if found in DB.
     */
    public Optional<String> resolveLink(String shortCode) {
        String cacheKey = REDIS_PREFIX + shortCode;
        
        // L1 Cache check
        String cachedUrl = redisTemplate.opsForValue().get(cacheKey);
        if (cachedUrl != null) {
            log.debug("Cache Hit: {}", shortCode);
            return Optional.of(cachedUrl);
        }

        // L2 DB check
        log.debug("Cache Miss: {}", shortCode);
        Optional<Link> linkOpt = linkRepository.findByShortCode(shortCode);
        
        if (linkOpt.isPresent()) {
            String longUrl = linkOpt.get().getLongUrl();
            // Async Hydration (Wait, synchronous for now to ensure availability for next hit)
            redisTemplate.opsForValue().set(cacheKey, longUrl, CACHE_TTL);
            return Optional.of(longUrl);
        }
        
        return Optional.empty();
    }

    public java.util.List<Link> getLinksByUserId(Long userId) {
        return linkRepository.findByUserId(userId);
    }
    
    @Transactional
    public void deleteLink(Long id, Long userId) {
        Optional<Link> link = linkRepository.findByIdAndUserId(id, userId);
        if (link.isPresent()) {
            Link l = link.get();
            redisTemplate.delete(REDIS_PREFIX + l.getShortCode());
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
