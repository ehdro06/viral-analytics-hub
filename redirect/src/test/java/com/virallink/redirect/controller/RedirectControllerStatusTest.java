package com.virallink.redirect.controller;

import com.virallink.redirect.config.JwtAuthenticationFilter;
import com.virallink.redirect.config.SecurityConfig;
import com.virallink.redirect.model.Link;
import com.virallink.redirect.service.LinkService;
import com.virallink.redirect.service.LinkService.Resolution;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.io.Decoders;
import io.jsonwebtoken.security.Keys;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.web.servlet.FilterRegistrationBean;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import java.time.Instant;
import java.util.Map;
import java.util.Optional;

import static org.hamcrest.Matchers.containsString;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(RedirectController.class)
@Import({SecurityConfig.class, JwtAuthenticationFilter.class, RedirectControllerStatusTest.SecurityChainOnly.class})
@ActiveProfiles("test")
class RedirectControllerStatusTest {

    /**
     * The JWT filter is a bean, so it is also registered as a plain servlet filter. MockMvc runs that copy before the
     * security chain, which then resets the context it set. Keep only the copy inside the security chain (as on Tomcat,
     * where the plain registration runs after the chain and is skipped as already-filtered).
     */
    @TestConfiguration
    static class SecurityChainOnly {
        @Bean
        FilterRegistrationBean<JwtAuthenticationFilter> jwtFilterServletRegistration(JwtAuthenticationFilter filter) {
            FilterRegistrationBean<JwtAuthenticationFilter> registration = new FilterRegistrationBean<>(filter);
            registration.setEnabled(false);
            return registration;
        }
    }

    // Same secret as application-test.properties
    private static final String JWT_SECRET = "AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA=";

    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private LinkService linkService;

    private static String bearer(long userId) {
        return "Bearer " + Jwts.builder().claims(Map.of("userId", userId)).subject("u@example.com")
                .signWith(Keys.hmacShaKeyFor(Decoders.BASE64.decode(JWT_SECRET))).compact();
    }

    @Test
    void inactiveLink_Shows410Page() throws Exception {
        when(linkService.resolveLink(eq("abc123"), any(), any(), any()))
                .thenReturn(new Resolution(Resolution.Kind.INACTIVE, null));

        mockMvc.perform(get("/abc123"))
                .andExpect(status().isGone())
                .andExpect(header().string("Cache-Control", "no-store"))
                .andExpect(content().contentTypeCompatibleWith(MediaType.TEXT_HTML))
                .andExpect(content().string(containsString("This link is no longer active")));
    }

    @Test
    void activeLink_Redirects302() throws Exception {
        when(linkService.resolveLink(eq("abc123"), any(), any(), any()))
                .thenReturn(new Resolution(Resolution.Kind.REDIRECT, "https://example.com"));

        mockMvc.perform(get("/abc123"))
                .andExpect(status().isFound())
                .andExpect(header().string("Location", "https://example.com"));
    }

    @Test
    void unknownLink_Is404() throws Exception {
        when(linkService.resolveLink(anyString(), any(), any(), any()))
                .thenReturn(new Resolution(Resolution.Kind.NOT_FOUND, null));

        mockMvc.perform(get("/zzzzzz")).andExpect(status().isNotFound());
    }

    @Test
    void patch_UpdatesOwnLink_AndReturnsStatus() throws Exception {
        Instant expiry = Instant.parse("2030-01-01T00:00:00Z");
        when(linkService.updateStatus(7L, 42L, true, expiry)).thenReturn(Optional.of(Link.builder()
                .id(7L).shortCode("abc123").longUrl("https://example.com").userId(42L)
                .paused(true).expiresAt(expiry).build()));

        mockMvc.perform(patch("/api/v1/links/7").header("Authorization", bearer(42))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"paused\":true,\"expiresAt\":\"2030-01-01T00:00:00Z\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("paused"))
                .andExpect(jsonPath("$.paused").value(true))
                .andExpect(jsonPath("$.expiresAt").value("2030-01-01T00:00:00Z"));
    }

    @Test
    void patch_SomeoneElsesLink_Is404() throws Exception {
        when(linkService.updateStatus(anyLong(), eq(99L), eq(false), any())).thenReturn(Optional.empty());

        mockMvc.perform(patch("/api/v1/links/7").header("Authorization", bearer(99))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"paused\":false,\"expiresAt\":null}"))
                .andExpect(status().isNotFound());
    }

    @Test
    void patch_WithoutLogin_Is401() throws Exception {
        mockMvc.perform(patch("/api/v1/links/7").contentType(MediaType.APPLICATION_JSON)
                        .content("{\"paused\":true,\"expiresAt\":null}"))
                .andExpect(status().isUnauthorized());
    }
}
