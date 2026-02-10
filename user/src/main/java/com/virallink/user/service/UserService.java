package com.virallink.user.service;

import com.virallink.user.model.ApiKey;
import com.virallink.user.model.User;
import com.virallink.user.repository.ApiKeyRepository;
import com.virallink.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.keygen.Base64StringKeyGenerator;
import org.springframework.security.crypto.keygen.StringKeyGenerator;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.util.Base64;
import java.util.List;

@Service
@RequiredArgsConstructor
public class UserService {

    private final UserRepository userRepository;
    private final ApiKeyRepository apiKeyRepository;
    
    // 32 bytes = 256 bits of entropy
    private final StringKeyGenerator keyGenerator = new Base64StringKeyGenerator(32);

    public User getUserByEmail(String email) {
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));
    }
    
    public User getUserByProviderId(String provider, String providerId) {
         return userRepository.findByProviderAndProviderId(provider, providerId)
                .orElseThrow(() -> new RuntimeException("User not found"));
    }

    @Transactional
    public String createApiKey(User user) {
        String rawKey = keyGenerator.generateKey();
        String prefix = rawKey.substring(0, 7);
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
}
