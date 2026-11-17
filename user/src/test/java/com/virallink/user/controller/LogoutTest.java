package com.virallink.user.controller;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.oauth2Login;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;

/** Logout must be a POST: a plain link (GET) from another site must not sign people out. */
@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class LogoutTest {

    @Autowired private MockMvc mockMvc;
    @MockitoBean private StringRedisTemplate redisTemplate;

    @Test
    void postLogsOut() throws Exception {
        MvcResult r = mockMvc.perform(post("/logout").with(oauth2Login())).andReturn();
        assertThat(r.getResponse().getStatus()).isEqualTo(302);
        assertThat(r.getResponse().getRedirectedUrl()).endsWith("/login");
    }

    @Test
    void getDoesNotLogOut() throws Exception {
        MvcResult r = mockMvc.perform(get("/logout").with(oauth2Login())).andReturn();
        String location = r.getResponse().getRedirectedUrl();
        assertThat(location == null || !location.endsWith("/login")).as("GET /logout must not run the logout").isTrue();
    }
}
