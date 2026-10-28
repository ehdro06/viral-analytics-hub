package com.virallink.analytics.controller;

import com.virallink.analytics.service.AnalyticsSpongeService;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RestController;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.util.Map;

/**
 * On-demand drain of the click stream, called by Cloud Scheduler once a minute in production. Between calls the
 * service does nothing, so Cloud Run can bill per request and scale to zero instead of keeping CPU allocated.
 *
 * <p>Not user-facing: protected by a shared token ({@code X-Sponge-Token}), and absent (404) unless
 * {@code analytics.sponge.trigger-token} is configured.
 */
@RestController
public class SpongeTriggerController {

    static final String TOKEN_HEADER = "X-Sponge-Token";

    private final AnalyticsSpongeService spongeService;
    private final byte[] triggerToken;

    public SpongeTriggerController(AnalyticsSpongeService spongeService,
                                   @Value("${analytics.sponge.trigger-token:}") String triggerToken) {
        this.spongeService = spongeService;
        this.triggerToken = triggerToken.getBytes(StandardCharsets.UTF_8);
    }

    @PostMapping("/internal/sponge/drain")
    public ResponseEntity<Map<String, Integer>> drain(@RequestHeader(value = TOKEN_HEADER, required = false) String token) {
        if (triggerToken.length == 0) {
            return ResponseEntity.notFound().build();
        }
        if (token == null || !MessageDigest.isEqual(triggerToken, token.getBytes(StandardCharsets.UTF_8))) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        }
        return ResponseEntity.ok(Map.of("processed", spongeService.spongeEvents()));
    }
}
