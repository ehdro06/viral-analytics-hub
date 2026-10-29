package com.virallink.redirect.config;

import com.virallink.redirect.controller.RedirectController;
import com.virallink.redirect.service.LinkService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.context.annotation.Import;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import com.virallink.redirect.config.RateLimitConfig;
import com.virallink.redirect.service.RateLimiter;
import org.springframework.test.web.servlet.MockMvc;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(RedirectController.class)
@Import({SecurityConfig.class, JwtAuthenticationFilter.class, RateLimitConfig.class})
@ActiveProfiles("test")
class SecurityConfigTest {

    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private LinkService linkService;

    @MockitoBean
    private RateLimiter rateLimiter;

    @Test
    void linkApi_WithoutToken_Returns401() throws Exception {
        mockMvc.perform(get("/api/v1/links"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void linkApi_WithInvalidToken_Returns401() throws Exception {
        mockMvc.perform(get("/api/v1/links").header("Authorization", "Bearer not-a-jwt"))
                .andExpect(status().isUnauthorized());
    }
}
