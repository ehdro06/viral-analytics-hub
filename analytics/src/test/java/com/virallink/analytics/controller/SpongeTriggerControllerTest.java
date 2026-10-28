package com.virallink.analytics.controller;

import com.virallink.analytics.config.JwtAuthenticationFilter;
import com.virallink.analytics.config.SecurityConfig;
import com.virallink.analytics.service.AnalyticsSpongeService;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.context.annotation.Import;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.TestPropertySource;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

class SpongeTriggerControllerTest {

    @Nested
    @WebMvcTest(SpongeTriggerController.class)
    @Import({SecurityConfig.class, JwtAuthenticationFilter.class})
    @ActiveProfiles("test")
    @TestPropertySource(properties = "analytics.sponge.trigger-token=s3cret-token")
    class WithToken {

        @Autowired
        private MockMvc mockMvc;

        @MockitoBean
        private AnalyticsSpongeService spongeService;

        @Test
        void correctToken_DrainsAndReportsCount() throws Exception {
            when(spongeService.spongeEvents()).thenReturn(7);

            mockMvc.perform(post("/internal/sponge/drain").header("X-Sponge-Token", "s3cret-token"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.processed").value(7));
        }

        @Test
        void wrongToken_Returns403WithoutDraining() throws Exception {
            mockMvc.perform(post("/internal/sponge/drain").header("X-Sponge-Token", "guess"))
                    .andExpect(status().isForbidden());
            verify(spongeService, never()).spongeEvents();
        }

        @Test
        void missingToken_Returns403WithoutDraining() throws Exception {
            mockMvc.perform(post("/internal/sponge/drain"))
                    .andExpect(status().isForbidden());
            verify(spongeService, never()).spongeEvents();
        }
    }

    @Nested
    @WebMvcTest(SpongeTriggerController.class)
    @Import({SecurityConfig.class, JwtAuthenticationFilter.class})
    @ActiveProfiles("test")
    class WithoutToken {

        @Autowired
        private MockMvc mockMvc;

        @MockitoBean
        private AnalyticsSpongeService spongeService;

        @Test
        void endpointIsDisabled() throws Exception {
            mockMvc.perform(post("/internal/sponge/drain").header("X-Sponge-Token", ""))
                    .andExpect(status().isNotFound());
            verify(spongeService, never()).spongeEvents();
        }
    }
}
