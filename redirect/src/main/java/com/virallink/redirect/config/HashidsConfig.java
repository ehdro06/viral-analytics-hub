package com.virallink.redirect.config;

import org.hashids.Hashids;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class HashidsConfig {
    @Value("${hashids.salt}")
    private String salt;

    @Value("${hashids.min-length:6}")
    private int minLength;

    @Bean
    public Hashids hashids() {
        // You can also provide a custom alphabet here if you want to be extra unique
        return new Hashids(salt, minLength);
    }
}
