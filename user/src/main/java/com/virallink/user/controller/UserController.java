package com.virallink.user.controller;

import com.virallink.user.model.ApiKey;
import com.virallink.user.model.User;
import com.virallink.user.service.UserService;
import com.virallink.user.service.JwtService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/users")
@RequiredArgsConstructor
public class UserController {

    private final UserService userService;
    private final JwtService jwtService;

    public record UserResponse(Long id, String email, String name, String token) {}

    public record ApiKeyResponse(Long id, String prefix, String createdAt) {}

    @GetMapping("/me")
    public ResponseEntity<UserResponse> getCurrentUser(@AuthenticationPrincipal Long userId) {
        if (userId == null) {
            return ResponseEntity.status(401).build();
        }

        User user = userService.getUserById(userId);
        String jwtToken = jwtService.generateToken(Map.of("userId", user.getId()), user.getEmail());

        return ResponseEntity.ok(new UserResponse(user.getId(), user.getEmail(), user.getName(), jwtToken));
    }

    @GetMapping("/keys")
    public ResponseEntity<List<ApiKeyResponse>> listApiKeys(@AuthenticationPrincipal Long userId) {
        if (userId == null) {
            return ResponseEntity.status(401).build();
        }

        User user = userService.getUserById(userId);
        List<ApiKeyResponse> keys = userService.getApiKeys(user).stream()
                .map(this::toApiKeyResponse)
                .toList();

        return ResponseEntity.ok(keys);
    }

    @PostMapping("/keys")
    public ResponseEntity<Map<String, String>> generateApiKey(@AuthenticationPrincipal Long userId) {
        if (userId == null) {
            return ResponseEntity.status(401).build();
        }

        User user = userService.getUserById(userId);
        String rawKey = userService.createApiKey(user);

        return ResponseEntity.ok(Map.of(
            "key", rawKey,
            "message", "Store this key safely. You won't be able to see it again."
        ));
    }

    private ApiKeyResponse toApiKeyResponse(ApiKey apiKey) {
        String createdAt = apiKey.getCreatedAt() != null ? apiKey.getCreatedAt().toString() : null;
        return new ApiKeyResponse(apiKey.getId(), apiKey.getPrefix(), createdAt);
    }
}
