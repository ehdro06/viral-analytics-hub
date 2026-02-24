package com.virallink.analytics.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import ua_parser.Client;
import ua_parser.Parser;

import jakarta.annotation.PostConstruct;

@Service
@Slf4j
public class UserAgentService {

    private Parser uaParser;

    @PostConstruct
    public void init() {
        try {
            uaParser = new Parser();
        } catch (Exception e) {
            log.error("Failed to initialize UA Parser", e);
        }
    }

    public Client parse(String userAgent) {
        if (uaParser == null || userAgent == null) return null;
        return uaParser.parse(userAgent);
    }
}
