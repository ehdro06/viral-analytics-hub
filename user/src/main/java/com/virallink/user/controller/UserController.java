package com.virallink.user.controller;

import com.virallink.user.model.User;
import com.virallink.user.service.UserService;
import com.virallink.user.service.JwtService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.client.authentication.OAuth2AuthenticationToken;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.security.web.authentication.logout.SecurityContextLogoutHandler;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.Comparator;
import java.util.List;
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
    public ResponseEntity<Void> deleteCurrentUser(Authentication authentication,
                                                  HttpServletRequest request, HttpServletResponse response) {
        User user = currentUser(authentication);
        if (user == null) {
            return ResponseEntity.status(401).build();
        }
        userService.deleteAccount(user);
        new SecurityContextLogoutHandler().logout(request, response, authentication); // also ends the login session
        return ResponseEntity.noContent().build();
    }

    /** Only what the Settings page lists: the key's public prefix and when it was made. Never the hash. */
    public record ApiKeyItem(Long id, String prefix, LocalDateTime createdAt) {}

    @GetMapping("/keys")
    public ResponseEntity<List<ApiKeyItem>> listApiKeys(Authentication authentication) {
        User user = currentUser(authentication);
        if (user == null) {
            return ResponseEntity.status(401).build();
        }
        List<ApiKeyItem> keys = userService.getApiKeys(user).stream()
                .sorted(Comparator.comparing(k -> k.getCreatedAt(), Comparator.nullsLast(Comparator.reverseOrder())))
                .map(k -> new ApiKeyItem(k.getId(), k.getPrefix(), k.getCreatedAt()))
                .toList();
        return ResponseEntity.ok(keys);
    }

    @PostMapping("/keys")
    public ResponseEntity<Map<String, String>> generateApiKey(Authentication authentication) {
        User user = currentUser(authentication);
        if (user == null) {
            return ResponseEntity.status(401).build();
        }
        String rawKey = userService.createApiKey(user);

        return ResponseEntity.ok(Map.of(
            "key", rawKey,
            "message", "Store this key safely. You won't be able to see it again."
        ));
    }

    /**
     * The signed-in user, however the request proved it. The browser sends both the login session cookie and the API
     * token (authFetch adds {@code Authorization: Bearer} to every call); when the token is present the JWT filter
     * replaces the session's OAuth2 identity with the token's user id, so both shapes must be understood here.
     */
    private User currentUser(Authentication authentication) {
        if (authentication instanceof OAuth2AuthenticationToken oauth) {
            return resolveUser(oauth, oauth.getPrincipal());
        }
        if (authentication != null && authentication.getPrincipal() instanceof Long userId) {
            return userService.getUserById(userId);
        }
        return null;
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
