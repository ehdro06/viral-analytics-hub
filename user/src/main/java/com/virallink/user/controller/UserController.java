package com.virallink.user.controller;

import com.virallink.user.model.User;
import com.virallink.user.service.UserService;
import com.virallink.user.service.JwtService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.client.authentication.OAuth2AuthenticationToken;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.security.web.authentication.logout.SecurityContextLogoutHandler;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/v1/users")
@RequiredArgsConstructor
public class UserController {

    private final UserService userService;
    private final JwtService jwtService;

    public record UserResponse(Long id, String email, String name, String tier, String token) {}

    @GetMapping("/me")
    public ResponseEntity<UserResponse> getCurrentUser(@AuthenticationPrincipal OAuth2User principal, 
                                               OAuth2AuthenticationToken token) {
        if (principal == null) {
            return ResponseEntity.status(401).build();
        }
        
        // Identify user from DB
        User user = resolveUser(token, principal);
        
        // Generate Token
        String jwtToken = jwtService.generateToken(Map.of("userId", user.getId()), user.getEmail());
        
        return ResponseEntity.ok(new UserResponse(user.getId(), user.getEmail(), user.getName(), user.getTier(), jwtToken));
    }

    /**
     * Deletes the signed-in account (right to erasure) and ends the session. The frontend first deletes the user's
     * links (redirect) and click data (analytics), which live in other services' databases.
     */
    @DeleteMapping("/me")
    public ResponseEntity<Void> deleteCurrentUser(@AuthenticationPrincipal OAuth2User principal,
                                                  OAuth2AuthenticationToken token,
                                                  HttpServletRequest request, HttpServletResponse response) {
        if (principal == null) {
            return ResponseEntity.status(401).build();
        }
        userService.deleteAccount(resolveUser(token, principal));
        new SecurityContextLogoutHandler().logout(request, response, token);
        return ResponseEntity.noContent().build();
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
