package com.virallink.redirect.config;

import com.virallink.redirect.controller.RedirectController;
import com.virallink.redirect.service.LinkService;
import com.virallink.redirect.service.RateLimiter;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.io.Decoders;
import io.jsonwebtoken.security.Keys;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.boot.web.servlet.FilterRegistrationBean;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Import;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import java.util.Map;

import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(RedirectController.class)
@Import({SecurityConfig.class, JwtAuthenticationFilter.class, RateLimitConfig.class, DeletedAccountAuthTest.SecurityChainOnly.class})
@ActiveProfiles("test")
class DeletedAccountAuthTest {

    // Same secret as application-test.properties
    private static final String JWT_SECRET = "AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA=";

    /** Keep only the JWT filter inside the security chain (see RedirectControllerStatusTest). */
    @TestConfiguration
    static class SecurityChainOnly {
        @Bean
        FilterRegistrationBean<JwtAuthenticationFilter> jwtFilterServletRegistration(JwtAuthenticationFilter filter) {
            FilterRegistrationBean<JwtAuthenticationFilter> registration = new FilterRegistrationBean<>(filter);
            registration.setEnabled(false);
            return registration;
        }
    }

    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private LinkService linkService;
    @MockitoBean
    private RateLimiter rateLimiter;
    @MockitoBean
    private StringRedisTemplate redis;

    private static String bearer(long userId) {
        return "Bearer " + Jwts.builder().claims(Map.of("userId", userId)).subject("u@example.com")
                .signWith(Keys.hmacShaKeyFor(Decoders.BASE64.decode(JWT_SECRET))).compact();
    }

    @Test
    void validTokenOfADeletedAccount_IsRefused() throws Exception {
        when(redis.hasKey("auth:deleted-user:42")).thenReturn(true);

        mockMvc.perform(get("/api/v1/links").header("Authorization", bearer(42)))
                .andExpect(status().isUnauthorized());
        verify(linkService, never()).getLinksByUserId(42L);
    }

    @Test
    void activeAccount_StillWorks() throws Exception {
        when(redis.hasKey("auth:deleted-user:43")).thenReturn(false);

        mockMvc.perform(get("/api/v1/links").header("Authorization", bearer(43)))
                .andExpect(status().isOk());
    }

    @Test
    void redisErrors_FailOpen() throws Exception {
        when(redis.hasKey("auth:deleted-user:44")).thenThrow(new RuntimeException("redis down"));

        mockMvc.perform(get("/api/v1/links").header("Authorization", bearer(44)))
                .andExpect(status().isOk());
    }

    @Test
    void deleteAllLinks_DeletesOnlyTheCallersLinks() throws Exception {
        when(redis.hasKey("auth:deleted-user:42")).thenReturn(false);
        when(linkService.deleteAllLinks(42L)).thenReturn(3);

        mockMvc.perform(delete("/api/v1/links").header("Authorization", bearer(42)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.deleted").value(3));
    }
}
