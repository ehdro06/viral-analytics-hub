package com.virallink.redirect.controller;

import com.virallink.redirect.service.UrlExpandService;
import com.virallink.redirect.service.UrlExpandService.ExpandResult;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import java.util.List;

import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(ExpandController.class)
@AutoConfigureMockMvc(addFilters = false) // Disable security filters for this pure unit test
class ExpandControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private UrlExpandService urlExpandService;

    @Test
    void testExpand_SuccessfulAndSafe_ReturnsOk() throws Exception {
        // 1. Arrange: Setup the mock behavior
        String inputUrl = "http://short.url";
        String finalUrl = "http://long.url";
        
        ExpandResult mockResult = ExpandResult.builder()
                .inputUrl(inputUrl)
                .finalUrl(finalUrl)
                .shortened(true)
                .safe(true)
                .hops(List.of())
                .build();

        // When the controller calls service.expand(), give it our mock object
        when(urlExpandService.expand(inputUrl)).thenReturn(mockResult);
        
        // When checking for safe browsing, pretend the URL is indeed safe
        when(urlExpandService.checkSafeBrowsing(finalUrl)).thenReturn(true);

        // 2. Act & 3. Assert: Perform the GET request and verify the JSON response
        mockMvc.perform(get("/api/expand").param("url", inputUrl))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.inputUrl").value(inputUrl))
                .andExpect(jsonPath("$.finalUrl").value(finalUrl))
                .andExpect(jsonPath("$.safe").value(true));
    }

    @Test
    void testExpand_FlaggedBySafeBrowsing_ReturnsOkButMarksUnsafe() throws Exception {
        // 1. Arrange
        String inputUrl = "http://dodgy-short.url";
        String finalUrl = "http://malware.site";
        
        ExpandResult mockResult = ExpandResult.builder()
                .inputUrl(inputUrl)
                .finalUrl(finalUrl)
                .shortened(true)
                .safe(true) // Initially thought it was safe after resolving
                .hops(List.of())
                .build();

        when(urlExpandService.expand(inputUrl)).thenReturn(mockResult);
        
        // Simulating that Google Safe Browsing flagged the final destination!
        when(urlExpandService.checkSafeBrowsing(finalUrl)).thenReturn(false);

        // 2. Act & 3. Assert: The status is 200 OK, but the JSON payload warns the user
        mockMvc.perform(get("/api/expand").param("url", inputUrl))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.finalUrl").value(finalUrl))
                .andExpect(jsonPath("$.safe").value(false))
                .andExpect(jsonPath("$.note").value("Flagged by Google Safe Browsing"));
    }

    @Test
    void testExpand_InvalidUrl_ReturnsBadRequest() throws Exception {
        // 1. Arrange
        String badUrl = "not-a-url";
        
        // Tell the mock to throw an exception when this specific bad input is provided
        when(urlExpandService.expand(badUrl)).thenThrow(new IllegalArgumentException("Invalid URL"));

        // 2. Act & 3. Assert
        mockMvc.perform(get("/api/expand").param("url", badUrl))
                .andExpect(status().isBadRequest());
    }
}
