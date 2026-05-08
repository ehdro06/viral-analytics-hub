package com.virallink.redirect.config;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.io.Decoders;
import io.jsonwebtoken.security.Keys;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.filter.OncePerRequestFilter;

import javax.crypto.Mac;
import javax.crypto.SecretKey;
import javax.crypto.spec.SecretKeySpec;
import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.util.Base64;
import java.util.Collections;

@Configuration
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    @Value("${jwt.secret}")
    private String secretKey;

    @Value("${api.key.signing-secret}")
    private String apiKeySigningSecret;

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
            throws ServletException, IOException {

        authenticateWithJwt(request);
        if (SecurityContextHolder.getContext().getAuthentication() == null) {
            authenticateWithApiKey(request);
        }

        filterChain.doFilter(request, response);
    }

    private void authenticateWithJwt(HttpServletRequest request) {
        String authHeader = request.getHeader("Authorization");
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            return;
        }

        String jwt = authHeader.substring(7);
        try {
            Claims claims = Jwts.parser()
                    .verifyWith(getSignInKey())
                    .build()
                    .parseSignedClaims(jwt)
                    .getPayload();

            Long userId = claims.get("userId", Long.class);
            String email = claims.getSubject();

            if (email != null && userId != null) {
                UsernamePasswordAuthenticationToken authToken = new UsernamePasswordAuthenticationToken(
                        userId,
                        null,
                        Collections.emptyList()
                );
                SecurityContextHolder.getContext().setAuthentication(authToken);
            }
        } catch (Exception e) {
            logger.debug("JWT validation failed: " + e.getMessage());
        }
    }

    private void authenticateWithApiKey(HttpServletRequest request) {
        String rawApiKey = request.getHeader("X-API-Key");
        if (rawApiKey == null || rawApiKey.isBlank()) {
            return;
        }

        Long userId = validateApiKeyAndExtractUserId(rawApiKey);
        if (userId == null) {
            return;
        }

        UsernamePasswordAuthenticationToken authToken = new UsernamePasswordAuthenticationToken(
                userId,
                null,
                Collections.emptyList()
        );
        SecurityContextHolder.getContext().setAuthentication(authToken);
    }

    private Long validateApiKeyAndExtractUserId(String rawApiKey) {
        String[] parts = rawApiKey.split("\\.", 2);
        if (parts.length != 2) {
            return null;
        }

        String prefix = parts[0];
        String providedSecret = parts[1];
        String expectedSecret = signPrefix(prefix);
        if (!MessageDigest.isEqual(
                providedSecret.getBytes(StandardCharsets.UTF_8),
                expectedSecret.getBytes(StandardCharsets.UTF_8)
        )) {
            return null;
        }

        try {
            byte[] payloadBytes = Base64.getUrlDecoder().decode(prefix);
            String payload = new String(payloadBytes, StandardCharsets.UTF_8);
            String[] payloadParts = payload.split(":", 3);
            return Long.parseLong(payloadParts[0]);
        } catch (Exception ignored) {
            return null;
        }
    }

    private String signPrefix(String prefix) {
        try {
            Mac mac = Mac.getInstance("HmacSHA256");
            SecretKeySpec keySpec = new SecretKeySpec(
                    apiKeySigningSecret.getBytes(StandardCharsets.UTF_8),
                    "HmacSHA256"
            );
            mac.init(keySpec);
            byte[] signature = mac.doFinal(prefix.getBytes(StandardCharsets.UTF_8));
            return Base64.getUrlEncoder().withoutPadding().encodeToString(signature);
        } catch (Exception e) {
            throw new RuntimeException("Failed to validate API key signature", e);
        }
    }

    private SecretKey getSignInKey() {
        byte[] keyBytes = Decoders.BASE64.decode(secretKey);
        return Keys.hmacShaKeyFor(keyBytes);
    }
}
