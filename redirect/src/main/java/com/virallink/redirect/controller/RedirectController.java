package com.virallink.redirect.controller;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import jakarta.servlet.http.HttpServletRequest;

import com.virallink.redirect.model.Link;
import com.virallink.redirect.service.LinkService;

import java.net.URI;
import java.util.Optional;

import java.util.List;
import org.springframework.security.core.annotation.AuthenticationPrincipal;

@RestController
@RequiredArgsConstructor
@Slf4j
public class RedirectController {

    private final LinkService linkService;

    @GetMapping("/{shortCode}")
    public ResponseEntity<Void> redirect(@PathVariable("shortCode") String shortCode, HttpServletRequest request) {
        log.debug("Redirect request: {}", shortCode);
        
        // Behind a proxy/load balancer Tomcat rewrites this from X-Forwarded-For, but only when the request comes
        // from a trusted proxy (server.forward-headers-strategy=native). A client cannot spoof its own IP.
        String ipAddress = request.getRemoteAddr();

        String userAgent = request.getHeader("User-Agent");
        String referer = request.getHeader("Referer");

        Optional<String> longUrlOpt = linkService.resolveLink(shortCode, ipAddress, userAgent, referer);
        
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
    public ResponseEntity<LinkResponse> createLink(@RequestBody LinkRequest request, 
                                                   @AuthenticationPrincipal Long userId) {
        Link link = linkService.createLink(request.longUrl(), userId);
        return ResponseEntity.ok(new LinkResponse(link.getShortCode(), link.getLongUrl()));
    }

    @GetMapping("/api/v1/links")
    public ResponseEntity<List<Link>> listLinks(@AuthenticationPrincipal Long userId) {
        return ResponseEntity.ok(linkService.getLinksByUserId(userId));
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
}
