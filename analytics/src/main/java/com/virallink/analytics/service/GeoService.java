package com.virallink.analytics.service;

import com.maxmind.geoip2.DatabaseReader;
import com.maxmind.geoip2.model.CityResponse;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import jakarta.annotation.PostConstruct;
import java.io.File;
import java.net.InetAddress;

@Service
@Slf4j
public class GeoService {

    private final boolean cityEnabled;
    private final String mmdbPath;
    private DatabaseReader dbReader;

    public GeoService(@Value("${analytics.geo.city.enabled:false}") boolean cityEnabled,
                      @Value("${analytics.geo.city.mmdb-path:}") String mmdbPath) {
        this.cityEnabled = cityEnabled;
        this.mmdbPath = mmdbPath;
    }

    @PostConstruct
    void init() {
        if (!cityEnabled) {
            log.info("Geo city enrichment disabled (analytics.geo.city.enabled=false)");
            return;
        }

        if (mmdbPath == null || mmdbPath.isBlank()) {
            log.warn("Geo city enrichment enabled but no mmdb path configured (analytics.geo.city.mmdb-path). Disabling.");
            return;
        }

        File dbFile = new File(mmdbPath);
        if (!dbFile.exists()) {
            log.warn("GeoLite database not found at {}. Disabling city enrichment.", mmdbPath);
            return;
        }

        try {
            dbReader = new DatabaseReader.Builder(dbFile).build();
            log.info("Loaded GeoLite database for city enrichment from {}", mmdbPath);
        } catch (Exception e) {
            log.error("Failed to load GeoLite database. City enrichment disabled.", e);
            dbReader = null;
        }
    }

    public String getCountry(String ip) {
        if (isLocal(ip)) return "Localhost";
        if (!cityEnabled || dbReader == null) return "Unknown";
        try {
            CityResponse response = dbReader.city(InetAddress.getByName(ip));
            if (response.getCountry() != null && response.getCountry().getName() != null) {
                return response.getCountry().getName();
            }
        } catch (Exception e) {
            log.debug("GeoIP country lookup failed: {}", e.getMessage());
        }
        return "Unknown";
    }

    public String getCity(String ip) {
        if (!cityEnabled || dbReader == null || isLocal(ip)) return "Unknown";
        try {
            CityResponse response = dbReader.city(InetAddress.getByName(ip));
            if (response.getCity() != null && response.getCity().getName() != null) {
                return response.getCity().getName();
            }
        } catch (Exception e) {
            log.debug("GeoIP city lookup failed: {}", e.getMessage());
        }
        return "Unknown";
    }

    private boolean isLocal(String ip) {
        return "127.0.0.1".equals(ip) || "0:0:0:0:0:0:0:1".equals(ip);
    }
}
