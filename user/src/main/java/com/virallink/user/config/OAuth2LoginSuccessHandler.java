package com.virallink.user.config;

import com.virallink.user.model.User;
import com.virallink.user.service.JwtService;
import com.virallink.user.service.UserService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.Authentication;
import org.springframework.security.oauth2.client.authentication.OAuth2AuthenticationToken;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.security.web.authentication.AuthenticationSuccessHandler;
import org.springframework.stereotype.Component;
import org.springframework.web.util.UriComponentsBuilder;

import java.io.IOException;
import java.util.Map;

@Component
@RequiredArgsConstructor
public class OAuth2LoginSuccessHandler implements AuthenticationSuccessHandler {

    private final UserService userService;
    private final JwtService jwtService;

    @Value("${app.frontend.url:http://localhost:3000}")
    private String frontendUrl;

    @Override
    public void onAuthenticationSuccess(HttpServletRequest request, HttpServletResponse response,
                                        Authentication authentication) throws IOException {
        OAuth2AuthenticationToken token = (OAuth2AuthenticationToken) authentication;
        OAuth2User principal = (OAuth2User) authentication.getPrincipal();
        User user = userService.resolveUserFromOAuth(token, principal);

        String jwt = jwtService.generateToken(Map.of("userId", user.getId()), user.getEmail());

        String redirectUrl = UriComponentsBuilder.fromUriString(frontendUrl + "/auth/callback")
                .queryParam("token", jwt)
                .queryParam("id", user.getId())
                .queryParam("email", user.getEmail())
                .queryParam("name", user.getName() != null ? user.getName() : "")
                .build()
                .encode()
                .toUriString();

        response.sendRedirect(redirectUrl);
    }
}
