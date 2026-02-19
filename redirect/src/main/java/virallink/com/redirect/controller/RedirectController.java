package main.java.virallink.redirect.controller;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import virallink.redirect.model.Link;
import virallink.redirect.service.LinkService;

import java.net.URI;
import java.util.Optional;

@RestController
@RequiredArgsConstructor
@Slf4j
public class RedirectController {

    private final LinkService linkService;

    // Hot Path: Redirect
    @GetMapping("/{shortCode}")
    public ResponseEntity<Void> redirect(@PathVariable String shortCode) {
        log.info("Redirect Request: {}", shortCode);
        Optional<String> longUrlOpt = linkService.resolveLink(shortCode);
        
        if (longUrlOpt.isPresent()) {
            return ResponseEntity.status(HttpStatus.FOUND) // 302 Found (Analytics friendly)
                    .location(URI.create(longUrlOpt.get()))
                    .build();
        } else {
            return ResponseEntity.notFound().build();
        }
    }

    // Link Management: Create
    @PostMapping("/api/v1/links")
    public ResponseEntity<LinkResponse> createLink(@RequestBody LinkRequest request) {
        Link link = linkService.createLink(request.longUrl());
        return ResponseEntity.ok(new LinkResponse(link.getShortCode(), link.getLongUrl()));
    }

    // DTOs
    public record LinkRequest(String longUrl) {}
    public record LinkResponse(String shortCode, String longUrl) {}
}
