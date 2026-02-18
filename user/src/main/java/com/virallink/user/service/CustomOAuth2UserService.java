package com.virallink.user.service;

import com.virallink.user.model.User;
import com.virallink.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.oauth2.client.userinfo.DefaultOAuth2UserService;
import org.springframework.security.oauth2.client.userinfo.OAuth2UserRequest;
import org.springframework.security.oauth2.core.OAuth2AuthenticationException;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Map;

@Service
@RequiredArgsConstructor
@Slf4j
public class CustomOAuth2UserService extends DefaultOAuth2UserService {

    private final UserRepository userRepository;

    @Override
    @Transactional
    public OAuth2User loadUser(OAuth2UserRequest userRequest) throws OAuth2AuthenticationException {
        OAuth2User oAuth2User = super.loadUser(userRequest);

        try {
            return processOAuth2User(userRequest, oAuth2User);
        } catch (Exception ex) {
            // Throwing an instance of AuthenticationException will trigger the OAuth2AuthenticationFailureHandler
            throw new OAuth2AuthenticationException(ex.getMessage());
        }
    }

    private OAuth2User processOAuth2User(OAuth2UserRequest userRequest, OAuth2User oAuth2User) {
        String registrationId = userRequest.getClientRegistration().getRegistrationId();
        Map<String, Object> attributes = oAuth2User.getAttributes();

        String tempProviderId = oAuth2User.getName();
        String tempEmail = (String) attributes.get("email");
        String tempName = (String) attributes.get("name");

        if (registrationId.equals("github")) {
            // GitHub IDs are often Integers in the attributes map
            tempProviderId = String.valueOf(attributes.get("id"));
            
            // Fallback for Email: user:email scope usually populates "email"
            // but sometimes it's still null if not verified
            tempEmail = (String) attributes.get("email");
            if (tempEmail == null) {
                tempEmail = attributes.get("login") + "@github.com"; 
            }

            // Fallback for Name: Use 'login' if 'name' is empty
            tempName = (String) attributes.get("name");
            if (tempName == null || tempName.isEmpty()) {
                tempName = (String) attributes.get("login");
            }
        }
        
        String finalProviderId = tempProviderId;
        String finalEmail = tempEmail;
        String finalName = tempName;

        log.info("Processing OAuth2 login for provider: {}, id: {}, email: {}", registrationId, finalProviderId, finalEmail);

        User user = userRepository.findByProviderAndProviderId(registrationId, finalProviderId)
                .map(existingUser -> updateExistingUser(existingUser, finalName, finalEmail))
                .orElseGet(() -> registerNewUser(registrationId, finalProviderId, finalName, finalEmail));

        return oAuth2User;

    }

    private User registerNewUser(String provider, String providerId, String name, String email) {
        User user = User.builder()
                .provider(provider)
                .providerId(providerId)
                .name(name)
                .email(email)
                .tier("FREE")
                .build();
        return userRepository.save(user);
    }

    private User updateExistingUser(User existingUser, String name, String email) {
        existingUser.setName(name);
        existingUser.setEmail(email);
        return userRepository.save(existingUser);
    }
}
