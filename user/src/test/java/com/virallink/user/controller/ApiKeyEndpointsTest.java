package com.virallink.user.controller;

import com.virallink.user.model.User;
import com.virallink.user.repository.ApiKeyRepository;
import com.virallink.user.repository.UserRepository;
import com.virallink.user.service.JwtService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.request.RequestPostProcessor;

import java.util.Map;

import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.oauth2Login;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * The Settings page calls the key endpoints the way a browser does: logged-in session cookie AND the API token in
 * {@code Authorization: Bearer} (authFetch adds it to every call).
 */
@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class ApiKeyEndpointsTest {

    @Autowired private MockMvc mockMvc;
    @Autowired private UserRepository userRepository;
    @Autowired private ApiKeyRepository apiKeyRepository;
    @Autowired private JwtService jwtService;
    @MockitoBean private StringRedisTemplate redisTemplate;

    private User user;
    private String bearer;

    @BeforeEach
    void setUp() {
        org.mockito.Mockito.when(redisTemplate.opsForValue())
                .thenReturn(org.mockito.Mockito.mock(org.springframework.data.redis.core.ValueOperations.class));
        apiKeyRepository.deleteAll();
        userRepository.deleteAll();
        user = userRepository.save(User.builder().email("keys@example.com").name("Keys").provider("google")
                .providerId("google-sub-1").build());
        bearer = "Bearer " + jwtService.generateToken(Map.of("userId", user.getId()), user.getEmail());
    }

    private RequestPostProcessor session() {
        return oauth2Login().clientRegistration(
                        org.springframework.security.oauth2.client.registration.ClientRegistration.withRegistrationId("google")
                                .clientId("x").authorizationGrantType(org.springframework.security.oauth2.core.AuthorizationGrantType.AUTHORIZATION_CODE)
                                .redirectUri("http://localhost/cb").authorizationUri("http://localhost/a").tokenUri("http://localhost/t").build())
                .attributes(a -> a.put("sub", "google-sub-1"));
    }

    @Test
    void createThenList_WithSessionAndBearer_AsTheBrowserSendsIt() throws Exception {
        mockMvc.perform(post("/api/v1/users/keys").with(session()).header("Authorization", bearer).with(csrfIfNeeded()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.key").exists());

        mockMvc.perform(get("/api/v1/users/keys").with(session()).header("Authorization", bearer))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(1))
                .andExpect(jsonPath("$[0].prefix").exists())
                .andExpect(jsonPath("$[0].hashedKey").doesNotExist());
    }

    @Test
    void list_WithSessionOnly_Works() throws Exception {
        mockMvc.perform(get("/api/v1/users/keys").with(session()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(0));
    }

    @Test
    void deleteAccount_WithSessionAndBearer_AsTheBrowserSendsIt() throws Exception {
        mockMvc.perform(org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete("/api/v1/users/me")
                        .with(session()).header("Authorization", bearer).with(csrfIfNeeded()))
                .andExpect(status().isNoContent());
        org.assertj.core.api.Assertions.assertThat(userRepository.findById(user.getId())).isEmpty();
    }

    private static RequestPostProcessor csrfIfNeeded() {
        return org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf();
    }
}
