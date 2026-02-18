package com.virallink.user.service;

import com.virallink.user.model.User;
import com.virallink.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.oauth2.client.oidc.userinfo.OidcUserRequest;
import org.springframework.security.oauth2.client.oidc.userinfo.OidcUserService;
import org.springframework.security.oauth2.core.OAuth2AuthenticationException;
import org.springframework.security.oauth2.core.OAuth2Error;
import org.springframework.security.oauth2.core.oidc.user.OidcUser;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Map;

@Service
@RequiredArgsConstructor
@Slf4j
public class CustomOidcUserService extends OidcUserService {

    private final UserRepository userRepository;

    @Override
    @Transactional
    public OidcUser loadUser(OidcUserRequest userRequest) throws OAuth2AuthenticationException {
        OidcUser oidcUser = super.loadUser(userRequest);
        try {
            persistUser(userRequest, oidcUser);
            return oidcUser;
        } catch (Exception ex) {
            OAuth2Error oauth2Error = new OAuth2Error("Server Error", ex.getMessage(), null);
            throw new OAuth2AuthenticationException(oauth2Error, ex);
        }
    }

    private void persistUser(OidcUserRequest userRequest, OidcUser oidcUser) {
        String registrationId = userRequest.getClientRegistration().getRegistrationId();
        Map<String, Object> attributes = oidcUser.getAttributes();

        // Google provides "sub" as stable identifier
        String providerId = (String) attributes.getOrDefault("sub", oidcUser.getName());
        String email = (String) attributes.get("email");
        String name = (String) attributes.get("name");

        log.info("Processing OIDC login for provider: {}, id: {}, email: {}", registrationId, providerId, email);

        userRepository.findByProviderAndProviderId(registrationId, providerId)
                .map(existing -> updateExistingUser(existing, name, email))
                .orElseGet(() -> registerNewUser(registrationId, providerId, name, email));
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
