package com.virallink.user.service;

import com.virallink.user.model.ApiKey;
import com.virallink.user.model.User;
import com.virallink.user.repository.ApiKeyRepository;
import com.virallink.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.oauth2.client.authentication.OAuth2AuthenticationToken;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.security.crypto.keygen.Base64StringKeyGenerator;
import org.springframework.security.crypto.keygen.StringKeyGenerator;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.util.Base64;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class UserService {

    private final UserRepository userRepository;
    private final ApiKeyRepository apiKeyRepository;

    @Value("${api.key.signing-secret}")
    private String apiKeySigningSecret;

    // 16 bytes = 128 bits entropy for key identifier
    private final StringKeyGenerator keyGenerator = new Base64StringKeyGenerator(16);

    public User getUserById(Long id) {
        return userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("User not found"));
    }

    public User getUserByEmail(String email) {
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));
    }

    public User resolveUserFromOAuth(OAuth2AuthenticationToken token, OAuth2User principal) {
        String registrationId = token.getAuthorizedClientRegistrationId();
        String providerId = principal.getName();

        if ("github".equals(registrationId)) {
            Object idObj = principal.getAttribute("id");
            if (idObj instanceof Integer) {
                providerId = String.valueOf(idObj);
            }
        } else if ("google".equals(registrationId)) {
            providerId = principal.getAttribute("sub");
        }

        return getUserByProviderId(registrationId, providerId);
    }
    
    public User getUserByProviderId(String provider, String providerId) {
         return userRepository.findByProviderAndProviderId(provider, providerId)
                .orElseThrow(() -> new RuntimeException("User not found"));
    }

    @Transactional
    public String createApiKey(User user) {
        String keyId = keyGenerator.generateKey();
        String payload = user.getId() + ":" + keyId + ":" + UUID.randomUUID();
        String prefix = Base64.getUrlEncoder()
                .withoutPadding()
                .encodeToString(payload.getBytes(StandardCharsets.UTF_8));
        String secret = signPrefix(prefix);
        String rawKey = prefix + "." + secret;
        String hashedKey = hashKey(rawKey);

        ApiKey apiKey = ApiKey.builder()
                .user(user)
                .prefix(prefix)
                .hashedKey(hashedKey)
                .build();

        apiKeyRepository.save(apiKey);
        
        // Return raw key only once
        return rawKey;
    }

    public List<ApiKey> getApiKeys(User user) {
        return apiKeyRepository.findByUserId(user.getId());
    }

    private String hashKey(String key) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hash = digest.digest(key.getBytes(StandardCharsets.UTF_8));
            return Base64.getEncoder().encodeToString(hash);
        } catch (NoSuchAlgorithmException e) {
            throw new RuntimeException("Error hashing API key", e);
        }
    }

    private String signPrefix(String prefix) {
        try {
            Mac mac = Mac.getInstance("HmacSHA256");
            SecretKeySpec keySpec = new SecretKeySpec(
                    apiKeySigningSecret.getBytes(StandardCharsets.UTF_8),
                    "HmacSHA256"
            );
            mac.init(keySpec);
            byte[] signature = mac.doFinal(prefix.getBytes(StandardCharsets.UTF_8));
            return Base64.getUrlEncoder().withoutPadding().encodeToString(signature);
        } catch (Exception e) {
            throw new RuntimeException("Error signing API key", e);
        }
    }
}
