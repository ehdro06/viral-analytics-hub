package com.virallink.user.controller;

import com.virallink.user.model.User;
import com.virallink.user.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.client.authentication.OAuth2AuthenticationToken;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/v1/users")
@RequiredArgsConstructor
public class UserController {

    private final UserService userService;

    @GetMapping("/me")
    public ResponseEntity<User> getCurrentUser(@AuthenticationPrincipal OAuth2User principal, 
                                               OAuth2AuthenticationToken token) {
        if (principal == null) {
            return ResponseEntity.status(401).build();
        }
        
        // Identify user from DB
        User user = resolveUser(token, principal);
        return ResponseEntity.ok(user);
    }

    @PostMapping("/keys")
    public ResponseEntity<Map<String, String>> generateApiKey(@AuthenticationPrincipal OAuth2User principal,
                                                              OAuth2AuthenticationToken token) {
        User user = resolveUser(token, principal);
        String rawKey = userService.createApiKey(user);
        
        return ResponseEntity.ok(Map.of(
            "key", rawKey,
            "message", "Store this key safely. You won't be able to see it again."
        ));
    }

    private User resolveUser(OAuth2AuthenticationToken token, OAuth2User principal) {
        String registrationId = token.getAuthorizedClientRegistrationId();
        String providerId = principal.getName();
        
        // GitHub uses 'id' (Integer) as name in DefaultOAuth2User sometimes, but let's check attributes
        // My CustomOAuth2UserService handled the registration/update.
        // I need to start fetching consistently.
        
        if ("github".equals(registrationId)) {
             Object idObj = principal.getAttribute("id");
             if (idObj instanceof Integer) {
                 providerId = String.valueOf(idObj);
             }
        } else if ("google".equals(registrationId)) {
            providerId = principal.getAttribute("sub");
        }

        return userService.getUserByProviderId(registrationId, providerId);
    }
}
