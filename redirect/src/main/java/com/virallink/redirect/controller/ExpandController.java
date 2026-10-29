package com.virallink.redirect.controller;

import com.virallink.redirect.config.RateLimitConfig.RateLimits;
import com.virallink.redirect.service.RateLimiter;
import com.virallink.redirect.service.UrlExpandService;
import com.virallink.redirect.service.UrlExpandService.ExpandResult;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.time.Duration;

@RestController
@RequiredArgsConstructor
public class ExpandController {

    private final UrlExpandService urlExpandService;
    private final RateLimiter rateLimiter;
    private final RateLimits limits;

    @GetMapping("/api/expand")
    public ResponseEntity<ExpandResult> expand(@RequestParam("url") String url, @AuthenticationPrincipal Long userId,
                                               HttpServletRequest request) {
        // Public endpoint: limit per signed-in user, otherwise per client IP (requests through Vercel share Vercel's
        // IPs, so the overall cap below is what protects the outbound fetches and the Safe Browsing quota).
        String subject = userId != null ? "user:" + userId : "ip:" + request.getRemoteAddr();
        rateLimiter.check("expand-minute", subject, limits.expandPerMinute(), Duration.ofMinutes(1),
                "Too many lookups. Please wait a minute and try again.");
        rateLimiter.check("expand-global", "all", limits.expandGlobalPerMinute(), Duration.ofMinutes(1),
                "The expander is busy right now. Please try again in a minute.");
        try {
            ExpandResult result = urlExpandService.expand(url);
            
            // Check Google Safe Browsing on the final URL if it resolved successfully
            if (result.isSafe() && result.getFinalUrl() != null) {
                boolean isGoogleSafe = urlExpandService.checkSafeBrowsing(result.getFinalUrl());
                if (!isGoogleSafe) {
                    result.setSafe(false);
                    result.setNote("Flagged by Google Safe Browsing");
                }
            }
            
            return ResponseEntity.ok(result);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().build();
        }
    }
}
