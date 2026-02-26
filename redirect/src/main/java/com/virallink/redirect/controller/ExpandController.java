package com.virallink.redirect.controller;

import com.virallink.redirect.service.UrlExpandService;
import com.virallink.redirect.service.UrlExpandService.ExpandResult;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequiredArgsConstructor
public class ExpandController {

    private final UrlExpandService urlExpandService;

    @GetMapping("/api/expand")
    public ResponseEntity<ExpandResult> expand(@RequestParam("url") String url) {
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
