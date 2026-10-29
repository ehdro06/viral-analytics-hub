package com.virallink.redirect.controller;

import com.virallink.redirect.config.RateLimitConfig;
import com.virallink.redirect.service.LinkService;
import com.virallink.redirect.service.RateLimiter;
import com.virallink.redirect.service.UrlExpandService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import java.time.Duration;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyInt;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest({RedirectController.class, ExpandController.class})
@AutoConfigureMockMvc(addFilters = false) // security is covered elsewhere; this is about the 429 response
@Import(RateLimitConfig.class)
class RateLimitResponseTest {

    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private LinkService linkService;
    @MockitoBean
    private UrlExpandService urlExpandService;
    @MockitoBean
    private RateLimiter rateLimiter;

    @Test
    void createLink_OverTheLimit_Returns429WithRetryAfterAndMessage() throws Exception {
        doThrow(new RateLimiter.LimitExceededException("You're creating links too quickly.", 37))
                .when(rateLimiter).check(eq("links-minute"), anyString(), anyInt(), any(Duration.class), anyString());

        mockMvc.perform(post("/api/v1/links").contentType(MediaType.APPLICATION_JSON).content("{\"longUrl\":\"https://example.com\"}"))
                .andExpect(status().isTooManyRequests())
                .andExpect(header().string("Retry-After", "37"))
                .andExpect(jsonPath("$.message").value("You're creating links too quickly."));
        verify(linkService, never()).createLink(any(), any());
    }

    @Test
    void expand_OverTheLimit_Returns429WithoutFetchingAnything() throws Exception {
        doThrow(new RateLimiter.LimitExceededException("Too many lookups.", 12))
                .when(rateLimiter).check(eq("expand-minute"), anyString(), anyInt(), any(Duration.class), anyString());

        mockMvc.perform(get("/api/expand").param("url", "https://example.com"))
                .andExpect(status().isTooManyRequests())
                .andExpect(header().string("Retry-After", "12"));
        verify(urlExpandService, never()).expand(any());
    }
}
