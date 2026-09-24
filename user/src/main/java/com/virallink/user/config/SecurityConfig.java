package com.virallink.user.config;

import com.virallink.user.service.CustomOAuth2UserService;
import com.virallink.user.service.CustomOidcUserService;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpStatus;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.HttpStatusEntryPoint;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.List;

@Configuration
@EnableWebSecurity
@RequiredArgsConstructor
public class SecurityConfig {

    private final CustomOAuth2UserService customOAuth2UserService;
    private final CustomOidcUserService customOidcUserService;

    @Value("${app.frontend-url}")
    private String frontendUrl;

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
            .csrf(AbstractHttpConfigurer::disable) // Disable CSRF for simplicity in Phase 1 API
            .cors(cors -> cors.configurationSource(corsConfigurationSource()))
            .authorizeHttpRequests(auth -> auth
                // Health must stay public: infra probes and the local dev script have no JWT to send.
                // show-details defaults to "never", so this never leaks anything beyond {"status":"UP"}.
                .requestMatchers("/actuator/health", "/actuator/health/**").permitAll()
                .requestMatchers("/login/**", "/error", "/webjars/**").permitAll()
                .anyRequest().authenticated()
            )
            // API calls without a session get a plain 401 (the SPA handles it); only browser navigations
            // are redirected to the OAuth login page.
            .exceptionHandling(e -> e.defaultAuthenticationEntryPointFor(
                    new HttpStatusEntryPoint(HttpStatus.UNAUTHORIZED),
                    request -> request.getRequestURI().startsWith("/api/")))
            .oauth2Login(oauth2 -> oauth2
                .userInfoEndpoint(userInfo -> userInfo
                    // OIDC (e.g., Google) uses OidcUserService; GitHub uses OAuth2UserService
                    .oidcUserService(customOidcUserService)
                    .userService(customOAuth2UserService) // Persist user on login for non-OIDC providers
                )
                .defaultSuccessUrl(frontendUrl, true) // Redirect to frontend after login
            )
            .logout(logout -> logout
                .logoutSuccessUrl(frontendUrl + "/login")
                .invalidateHttpSession(true)
                // Spring Session (Redis) uses "SESSION" cookie; Tomcat fallback uses JSESSIONID
                .deleteCookies("JSESSIONID", "SESSION")
                .permitAll()
            );

        return http.build();
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();
        configuration.setAllowedOrigins(List.of(frontendUrl)); // Next.js Frontend
        configuration.setAllowedMethods(List.of("GET", "POST", "PUT", "DELETE", "OPTIONS"));
        configuration.setAllowedHeaders(List.of("*"));
        configuration.setAllowCredentials(true); // Allow Cookies (Session ID)

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration);
        return source;
    }
}
