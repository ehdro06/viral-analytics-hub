package com.virallink.redirect.controller;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import jakarta.servlet.http.HttpServletRequest;

import com.virallink.redirect.model.Link;
import com.virallink.redirect.service.LinkService;
import com.virallink.redirect.service.RateLimiter;
import com.virallink.redirect.config.RateLimitConfig.RateLimits;

import java.time.Duration;

import java.net.URI;
import java.time.Instant;

import java.util.List;
import org.springframework.security.core.annotation.AuthenticationPrincipal;

@RestController
@RequiredArgsConstructor
@Slf4j
public class RedirectController {

    private final LinkService linkService;
    private final RateLimiter rateLimiter;
    private final RateLimits limits;

    // Shown for paused or expired links. Plain inline HTML: this service has no template engine.
    static final String INACTIVE_PAGE = """
            <!doctype html>
            <html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
            <title>Link no longer active</title>
            <style>body{margin:0;min-height:100vh;display:flex;align-items:center;justify-content:center;
            font-family:system-ui,-apple-system,sans-serif;background:#09090b;color:#e4e4e7}
            main{max-width:28rem;padding:2rem;text-align:center}h1{font-size:1.25rem;margin:0 0 .5rem}
            p{margin:0;color:#a1a1aa;line-height:1.5}</style></head>
            <body><main><h1>This link is no longer active</h1>
            <p>The owner has paused it or it has expired.</p></main></body></html>
            """;

    @GetMapping("/{shortCode}")
    public ResponseEntity<?> redirect(@PathVariable("shortCode") String shortCode, HttpServletRequest request) {
        log.debug("Redirect request: {}", shortCode);
        
        // Behind a proxy/load balancer Tomcat rewrites this from X-Forwarded-For, but only when the request comes
        // from a trusted proxy (server.forward-headers-strategy=native). A client cannot spoof its own IP.
        String ipAddress = request.getRemoteAddr();

        String userAgent = request.getHeader("User-Agent");
        String referer = request.getHeader("Referer");

        LinkService.Resolution resolution = linkService.resolveLink(shortCode, ipAddress, userAgent, referer);

        return switch (resolution.kind()) {
            case REDIRECT -> ResponseEntity.status(HttpStatus.FOUND) // 302 Found (Analytics friendly)
                    .location(URI.create(resolution.longUrl()))
                    .build();
            // 410 Gone; no-store so the link works again right away once it is resumed
            case INACTIVE -> ResponseEntity.status(HttpStatus.GONE)
                    .header(HttpHeaders.CACHE_CONTROL, "no-store")
                    .contentType(MediaType.TEXT_HTML)
                    .body(INACTIVE_PAGE);
            case NOT_FOUND -> ResponseEntity.notFound().build();
        };
    }

    // Link Management: Create
    @PostMapping("/api/v1/links")
    public ResponseEntity<LinkResponse> createLink(@RequestBody LinkRequest request, 
                                                   @AuthenticationPrincipal Long userId) {
        String user = String.valueOf(userId);
        rateLimiter.check("links-minute", user, limits.linksPerMinute(), Duration.ofMinutes(1),
                "You're creating links too quickly. Please wait a minute and try again.");
        rateLimiter.check("links-day", user, limits.linksPerDay(), Duration.ofDays(1),
                "You've reached today's link limit. Please try again tomorrow.");
        Link link = linkService.createLink(request.longUrl(), userId);
        return ResponseEntity.ok(new LinkResponse(link.getShortCode(), link.getLongUrl()));
    }

    @GetMapping("/api/v1/links")
    public ResponseEntity<List<Link>> listLinks(@AuthenticationPrincipal Long userId) {
        return ResponseEntity.ok(linkService.getLinksByUserId(userId));
    }

    // Link Management: Pause/resume and set or clear the expiry (both fields are always sent)
    @PatchMapping("/api/v1/links/{id}")
    public ResponseEntity<Link> updateStatus(@PathVariable Long id, @RequestBody LinkStatusRequest request,
                                             @AuthenticationPrincipal Long userId) {
        return linkService.updateStatus(id, userId, request.paused(), request.expiresAt())
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/api/v1/links/{id}")
    public ResponseEntity<Void> deleteLink(@PathVariable Long id, 
                                           @AuthenticationPrincipal Long userId) {
        linkService.deleteLink(id, userId); // Safe delete (checks ownership)
        return ResponseEntity.noContent().build();
    }

    // DTOs
    public record LinkRequest(String longUrl) {}
    public record LinkResponse(String shortCode, String longUrl) {}
    public record LinkStatusRequest(boolean paused, Instant expiresAt) {}
}
