package com.virallink.analytics.config;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.io.Decoders;
import io.jsonwebtoken.security.Keys;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import javax.crypto.SecretKey;
import java.io.IOException;
import java.util.Collections;

/**
 * Verifies the Bearer JWT issued by the user service (same shared secret) and exposes the user id claim as
 * the authentication principal. Requests without a valid token stay unauthenticated and are rejected by
 * the security rules.
 */
@Component
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    // Set by the user service when an account is deleted (see UserService.DELETED_USER_KEY_PREFIX)
    private static final String DELETED_USER_KEY_PREFIX = "auth:deleted-user:";

    private final SecretKey signingKey;
    // Optional so web-slice tests run without Redis
    private final ObjectProvider<StringRedisTemplate> redis;

    public JwtAuthenticationFilter(@Value("${jwt.secret}") String secret, ObjectProvider<StringRedisTemplate> redis) {
        this.signingKey = Keys.hmacShaKeyFor(Decoders.BASE64.decode(secret));
        this.redis = redis;
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain chain)
            throws ServletException, IOException {

        String header = request.getHeader("Authorization");
        if (header != null && header.startsWith("Bearer ")) {
            try {
                Claims claims = Jwts.parser()
                        .verifyWith(signingKey)
                        .build()
                        .parseSignedClaims(header.substring(7))
                        .getPayload();

                Long userId = claims.get("userId", Long.class);
                if (userId != null && !isDeleted(userId)) {
                    SecurityContextHolder.getContext().setAuthentication(
                            new UsernamePasswordAuthenticationToken(userId, null, Collections.emptyList()));
                }
            } catch (Exception e) {
                logger.debug("JWT validation failed: " + e.getMessage());
            }
        }
        chain.doFilter(request, response);
    }

    /** A deleted account's JWT stays valid until it expires; refuse it. Fails open if Redis is unreachable. */
    private boolean isDeleted(Long userId) {
        StringRedisTemplate template = redis.getIfAvailable();
        if (template == null) return false;
        try {
            return Boolean.TRUE.equals(template.hasKey(DELETED_USER_KEY_PREFIX + userId));
        } catch (Exception e) {
            logger.warn("Deleted-account check unavailable: " + e.getMessage());
            return false;
        }
    }
}
